\set ON_ERROR_STOP on

-- P22C-3C Production preflight — READ ONLY and fail closed.
-- This file never applies the certified migration.

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY;

DO $p22c3c_preflight$
DECLARE
  product_total integer;
  product_active integer;
  product_draft integer;
  product_paused integer;
  product_archived integer;
  category_total integer;
  orphan_products integer;
  duplicate_product_slugs integer;
  duplicate_category_slugs integer;
  missing_prerequisites text[] := ARRAY[]::text[];
  existing_authority_objects text[] := ARRAY[]::text[];
  object_name text;
  enum_name text;
BEGIN
  IF current_setting('transaction_read_only') <> 'on' THEN
    RAISE EXCEPTION 'P22C-3C preflight must run in a read-only transaction';
  END IF;

  IF current_setting('server_version_num')::integer < 170000 THEN
    RAISE EXCEPTION 'P22C-3C requires PostgreSQL 17 or newer';
  END IF;

  IF pg_is_in_recovery() THEN
    RAISE EXCEPTION 'P22C-3C cannot run against a recovery replica';
  END IF;

  IF NOT has_schema_privilege(current_user, 'public', 'USAGE') THEN
    RAISE EXCEPTION 'Current role lacks USAGE on public schema';
  END IF;

  IF NOT has_schema_privilege(current_user, 'public', 'CREATE') THEN
    RAISE EXCEPTION 'Current role lacks CREATE on public schema';
  END IF;

  IF to_regclass('public.catalog_products') IS NULL THEN
    missing_prerequisites := array_append(missing_prerequisites, 'public.catalog_products');
  END IF;

  IF to_regclass('public.product_categories') IS NULL THEN
    missing_prerequisites := array_append(missing_prerequisites, 'public.product_categories');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_products'
      AND column_name = 'id'
      AND udt_name = 'uuid'
  ) THEN
    missing_prerequisites := array_append(missing_prerequisites, 'catalog_products.id uuid');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_products'
      AND column_name = 'status'
      AND udt_name = 'ProductStatus'
  ) THEN
    missing_prerequisites := array_append(missing_prerequisites, 'catalog_products.status ProductStatus');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_products'
      AND column_name = 'base_price'
      AND data_type = 'numeric'
  ) THEN
    missing_prerequisites := array_append(missing_prerequisites, 'catalog_products.base_price numeric');
  END IF;

  FOREACH object_name IN ARRAY ARRAY[
    'public.salora_jwt_roles()',
    'public.salora_is_staff()',
    'public.salora_is_manager()',
    'public.salora_is_admin()',
    'auth.role()',
    'gen_random_uuid()'
  ]
  LOOP
    IF to_regprocedure(object_name) IS NULL THEN
      missing_prerequisites := array_append(missing_prerequisites, object_name);
    END IF;
  END LOOP;

  IF cardinality(missing_prerequisites) > 0 THEN
    RAISE EXCEPTION 'P22C-3C missing prerequisites: %', array_to_string(missing_prerequisites, ', ');
  END IF;

  FOREACH object_name IN ARRAY ARRAY[
    'menu_collections',
    'menu_collection_sections',
    'menu_collection_products',
    'product_nutrition_profiles',
    'product_allergen_profiles',
    'menu_collection_revisions',
    'menu_publications',
    'menu_role_permissions',
    'staging_certification_metadata',
    'staging_menu_authority_metadata'
  ]
  LOOP
    IF to_regclass(format('public.%I', object_name)) IS NOT NULL THEN
      existing_authority_objects := array_append(
        existing_authority_objects,
        format('public.%I', object_name)
      );
    END IF;
  END LOOP;

  FOREACH enum_name IN ARRAY ARRAY[
    'MenuCollectionKind',
    'MenuCollectionStatus',
    'MenuMembershipSource',
    'FoodDataVerificationStatus',
    'MenuPublicationStatus',
    'MenuCollectionPermission'
  ]
  LOOP
    IF to_regtype(format('public.%I', enum_name)) IS NOT NULL THEN
      existing_authority_objects := array_append(
        existing_authority_objects,
        format('public.%I', enum_name)
      );
    END IF;
  END LOOP;

  IF cardinality(existing_authority_objects) > 0 THEN
    RAISE EXCEPTION 'P22C-3C authority schema is not fully absent: %', array_to_string(existing_authority_objects, ', ');
  END IF;

  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE status = 'ACTIVE')::integer,
    count(*) FILTER (WHERE status = 'DRAFT')::integer,
    count(*) FILTER (WHERE status = 'PAUSED')::integer,
    count(*) FILTER (WHERE status = 'ARCHIVED')::integer
  INTO
    product_total,
    product_active,
    product_draft,
    product_paused,
    product_archived
  FROM public.catalog_products
  WHERE brand_key = 'SALORA';

  SELECT count(*)::integer
  INTO category_total
  FROM public.product_categories
  WHERE brand_key = 'SALORA';

  IF product_total <> 117 OR product_active <> 104 OR product_draft <> 13 THEN
    RAISE EXCEPTION
      'P22C-3C product authority mismatch: total %, ACTIVE %, DRAFT %',
      product_total,
      product_active,
      product_draft;
  END IF;

  IF product_paused <> 0 OR product_archived <> 0 THEN
    RAISE EXCEPTION
      'P22C-3C unexpected product statuses: PAUSED %, ARCHIVED %',
      product_paused,
      product_archived;
  END IF;

  IF category_total <> 16 THEN
    RAISE EXCEPTION 'P22C-3C category authority mismatch: expected 16, found %', category_total;
  END IF;

  SELECT count(*)::integer
  INTO orphan_products
  FROM public.catalog_products product
  LEFT JOIN public.product_categories category
    ON category.id = product.category_id
    AND category.brand_key = 'SALORA'
  WHERE product.brand_key = 'SALORA'
    AND category.id IS NULL;

  IF orphan_products <> 0 THEN
    RAISE EXCEPTION 'P22C-3C found % products with missing categories', orphan_products;
  END IF;

  SELECT count(*)::integer
  INTO duplicate_product_slugs
  FROM (
    SELECT slug
    FROM public.catalog_products
    WHERE brand_key = 'SALORA'
    GROUP BY slug
    HAVING count(*) > 1
  ) duplicate_slugs;

  IF duplicate_product_slugs <> 0 THEN
    RAISE EXCEPTION 'P22C-3C found duplicate product slugs';
  END IF;

  SELECT count(*)::integer
  INTO duplicate_category_slugs
  FROM (
    SELECT slug
    FROM public.product_categories
    WHERE brand_key = 'SALORA'
    GROUP BY slug
    HAVING count(*) > 1
  ) duplicate_slugs;

  IF duplicate_category_slugs <> 0 THEN
    RAISE EXCEPTION 'P22C-3C found duplicate category slugs';
  END IF;
END;
$p22c3c_preflight$;

SELECT jsonb_build_object(
  'phase', 'P22C-3C',
  'mode', 'PRODUCTION_PREFLIGHT_READ_ONLY',
  'result', 'PASS',
  'database', current_database(),
  'currentUser', current_user,
  'serverVersion', current_setting('server_version'),
  'transactionReadOnly', current_setting('transaction_read_only'),
  'productAuthority', '117 / 104 ACTIVE / 13 DRAFT',
  'categories', 16,
  'authoritySchemaAbsent', true,
  'stagingMetadataAbsent', true
)::text;

ROLLBACK;
