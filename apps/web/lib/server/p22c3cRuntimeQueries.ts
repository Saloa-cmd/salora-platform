export const P22C3C_SNAPSHOT_QUERY = String.raw`
WITH product_state AS (
  SELECT
    count(*)::integer AS total,
    count(*) FILTER (WHERE status = 'ACTIVE')::integer AS active,
    count(*) FILTER (WHERE status = 'DRAFT')::integer AS draft,
    count(*) FILTER (WHERE status = 'PAUSED')::integer AS paused,
    count(*) FILTER (WHERE status = 'ARCHIVED')::integer AS archived,
    md5(
      COALESCE(
        string_agg(
          concat_ws(
            E'\x1f',
            id::text,
            category_id::text,
            slug,
            name,
            description,
            status::text,
            base_price::text,
            tags::text,
            COALESCE(pairing_hint, ''),
            COALESCE(ai_descriptor, ''),
            brand_key,
            COALESCE(name_ar, ''),
            COALESCE(name_en, ''),
            COALESCE(description_ar, ''),
            COALESCE(description_en, '')
          ),
          E'\x1e'
          ORDER BY id
        ),
        ''
      )
    ) AS fingerprint
  FROM public.catalog_products
  WHERE brand_key = 'SALORA'
),
category_state AS (
  SELECT
    count(*)::integer AS total,
    md5(
      COALESCE(
        string_agg(
          concat_ws(
            E'\x1f',
            id::text,
            slug,
            name,
            sort_order::text,
            brand_key,
            COALESCE(name_ar, ''),
            COALESCE(name_en, '')
          ),
          E'\x1e'
          ORDER BY id
        ),
        ''
      )
    ) AS fingerprint,
    COALESCE(
      jsonb_agg(slug ORDER BY slug),
      '[]'::jsonb
    ) AS slugs
  FROM public.product_categories
  WHERE brand_key = 'SALORA'
),
authority_tables AS (
  SELECT jsonb_object_agg(
    object_name,
    to_regclass(format('public.%I', object_name)) IS NOT NULL
  ) AS presence
  FROM unnest(ARRAY[
    'menu_collections',
    'menu_collection_sections',
    'menu_collection_products',
    'product_nutrition_profiles',
    'product_allergen_profiles',
    'menu_collection_revisions',
    'menu_publications',
    'menu_role_permissions'
  ]::text[]) AS object_name
),
authority_enums AS (
  SELECT jsonb_object_agg(
    object_name,
    to_regtype(format('public.%I', object_name)) IS NOT NULL
  ) AS presence
  FROM unnest(ARRAY[
    'MenuCollectionKind',
    'MenuCollectionStatus',
    'MenuMembershipSource',
    'FoodDataVerificationStatus',
    'MenuPublicationStatus',
    'MenuCollectionPermission'
  ]::text[]) AS object_name
),
helper_functions AS (
  SELECT jsonb_object_agg(
    object_name,
    to_regprocedure(object_name) IS NOT NULL
  ) AS presence
  FROM unnest(ARRAY[
    'public.salora_jwt_roles()',
    'public.salora_is_staff()',
    'public.salora_is_manager()',
    'public.salora_is_admin()',
    'auth.role()',
    'gen_random_uuid()'
  ]::text[]) AS object_name
),
operational_state AS (
  SELECT
    count(*) FILTER (
      WHERE pid <> pg_backend_pid()
        AND datname = current_database()
        AND xact_start IS NOT NULL
        AND xact_start < clock_timestamp() - interval '10 minutes'
    )::integer AS transactions_over_10m
  FROM pg_stat_activity
)
SELECT jsonb_build_object(
  'phase', 'P22C-3C',
  'mode', 'PRODUCTION_SNAPSHOT_READ_ONLY',
  'capturedAt', clock_timestamp(),
  'database', current_database(),
  'currentUser', current_user,
  'serverVersion', current_setting('server_version'),
  'serverVersionNum', current_setting('server_version_num')::integer,
  'transactionReadOnly', current_setting('transaction_read_only'),
  'catalog', jsonb_build_object(
    'products', jsonb_build_object(
      'total', product_state.total,
      'active', product_state.active,
      'draft', product_state.draft,
      'paused', product_state.paused,
      'archived', product_state.archived,
      'fingerprint', product_state.fingerprint
    ),
    'categories', jsonb_build_object(
      'total', category_state.total,
      'fingerprint', category_state.fingerprint,
      'slugs', category_state.slugs
    )
  ),
  'authorityTables', authority_tables.presence,
  'authorityEnums', authority_enums.presence,
  'helperFunctions', helper_functions.presence,
  'migrationLedgers', jsonb_build_object(
    'prisma', to_regclass('public._prisma_migrations') IS NOT NULL,
    'supabase', to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
  ),
  'stagingOnlyTables', jsonb_build_object(
    'staging_certification_metadata',
      to_regclass('public.staging_certification_metadata') IS NOT NULL,
    'staging_menu_authority_metadata',
      to_regclass('public.staging_menu_authority_metadata') IS NOT NULL
  ),
  'operations', jsonb_build_object(
    'transactionsOver10Minutes', operational_state.transactions_over_10m,
    'inRecovery', pg_is_in_recovery()
  )
)::text
FROM product_state
CROSS JOIN category_state
CROSS JOIN authority_tables
CROSS JOIN authority_enums
CROSS JOIN helper_functions
CROSS JOIN operational_state;
`.trim();

export const P22C3C_PREFLIGHT_DO = String.raw`
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
`.trim();

export const P22C3C_PREFLIGHT_RESULT_QUERY = String.raw`
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
`.trim();
