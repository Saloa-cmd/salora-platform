\set ON_ERROR_STOP on

-- P22C-3C Production snapshot — READ ONLY.
-- Execute only after the separate read-only Production access gate is approved.
-- Recommended invocation:
--   psql "$DATABASE_URL" -X -qAt -f scripts/p22c3c/sql/01_snapshot_read_only.sql > p22c3c-before.json

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

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

ROLLBACK;
