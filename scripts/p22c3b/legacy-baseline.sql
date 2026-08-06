\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END;
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )::text;
$$;

CREATE TYPE public."RoleName" AS ENUM (
  'CUSTOMER',
  'STAFF',
  'MANAGER',
  'ADMIN'
);

CREATE TYPE public."ProductStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED'
);

CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  brand_key varchar(40) NOT NULL DEFAULT 'SALORA',
  name_ar varchar(160),
  name_en varchar(160)
);

CREATE TABLE public.catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL
    REFERENCES public.product_categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  slug varchar(160) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text NOT NULL,
  status public."ProductStatus" NOT NULL DEFAULT 'DRAFT',
  base_price numeric(10,3) NOT NULL,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  pairing_hint text,
  ai_descriptor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  brand_key varchar(40) NOT NULL DEFAULT 'SALORA',
  name_ar varchar(160),
  name_en varchar(160),
  description_ar text,
  description_en text
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.salora_jwt_roles()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
  WITH jwt AS (
    SELECT auth.jwt() AS value
  ),
  roles_array AS (
    SELECT
      ARRAY(
        SELECT jsonb_array_elements_text(
          COALESCE(value -> 'app_metadata' -> 'roles', '[]'::jsonb)
        )
      ) AS roles,
      value
    FROM jwt
  )
  SELECT CASE
    WHEN COALESCE(array_length(roles, 1), 0) > 0 THEN roles
    WHEN value -> 'app_metadata' ? 'role'
      THEN ARRAY[value -> 'app_metadata' ->> 'role']
    ELSE ARRAY[]::text[]
  END
  FROM roles_array;
$$;

CREATE OR REPLACE FUNCTION public.salora_has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(public.salora_jwt_roles()) AS jwt_role(role_name)
    WHERE upper(jwt_role.role_name) = ANY(required_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.salora_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.salora_has_role(ARRAY['STAFF', 'MANAGER', 'ADMIN']);
$$;

CREATE OR REPLACE FUNCTION public.salora_is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.salora_has_role(ARRAY['MANAGER', 'ADMIN']);
$$;

CREATE OR REPLACE FUNCTION public.salora_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.salora_has_role(ARRAY['ADMIN']);
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

INSERT INTO public.product_categories (
  id,
  slug,
  name,
  sort_order,
  brand_key,
  name_ar,
  name_en
)
SELECT
  (
    '00000000-0000-0000-0000-' ||
    lpad(category_number::text, 12, '0')
  )::uuid,
  'category-' || lpad(category_number::text, 2, '0'),
  'Category ' || category_number,
  category_number,
  'SALORA',
  'تصنيف ' || category_number,
  'Category ' || category_number
FROM generate_series(1, 16) AS category_number;

INSERT INTO public.catalog_products (
  id,
  category_id,
  slug,
  name,
  description,
  status,
  base_price,
  tags,
  brand_key,
  name_ar,
  name_en,
  description_ar,
  description_en
)
SELECT
  (
    '10000000-0000-0000-0000-' ||
    lpad(product_number::text, 12, '0')
  )::uuid,
  (
    '00000000-0000-0000-0000-' ||
    lpad((((product_number - 1) % 16) + 1)::text, 12, '0')
  )::uuid,
  'product-' || lpad(product_number::text, 3, '0'),
  'Product ' || product_number,
  'Synthetic P22C-3B legacy fixture product ' || product_number,
  CASE
    WHEN product_number <= 104 THEN 'ACTIVE'::public."ProductStatus"
    ELSE 'DRAFT'::public."ProductStatus"
  END,
  (0.500 + (product_number::numeric / 100.000))::numeric(10,3),
  ARRAY['p22c3b', 'synthetic']::text[],
  'SALORA',
  'منتج ' || product_number,
  'Product ' || product_number,
  'وصف اصطناعي للاختبار ' || product_number,
  'Synthetic certification description ' || product_number
FROM generate_series(1, 117) AS product_number;

DO $baseline_assertions$
DECLARE
  product_total integer;
  product_active integer;
  product_draft integer;
  category_total integer;
BEGIN
  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE status = 'ACTIVE')::integer,
    count(*) FILTER (WHERE status = 'DRAFT')::integer
  INTO product_total, product_active, product_draft
  FROM public.catalog_products;

  SELECT count(*)::integer
  INTO category_total
  FROM public.product_categories;

  IF product_total <> 117 THEN
    RAISE EXCEPTION 'Expected 117 fixture products, found %', product_total;
  END IF;

  IF product_active <> 104 THEN
    RAISE EXCEPTION 'Expected 104 ACTIVE fixture products, found %', product_active;
  END IF;

  IF product_draft <> 13 THEN
    RAISE EXCEPTION 'Expected 13 DRAFT fixture products, found %', product_draft;
  END IF;

  IF category_total <> 16 THEN
    RAISE EXCEPTION 'Expected 16 fixture categories, found %', category_total;
  END IF;
END;
$baseline_assertions$;
