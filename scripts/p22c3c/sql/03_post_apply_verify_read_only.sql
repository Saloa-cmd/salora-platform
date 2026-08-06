\set ON_ERROR_STOP on

-- P22C-3C post-apply verification — READ ONLY.
-- This file is prepared now but may run only after separate final Production DDL approval.

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

DO $p22c3c_post_apply$
DECLARE
  table_count integer;
  enum_count integer;
  policy_count integer;
  rls_count integer;
  authority_rows bigint;
  security_definer_count integer;
  staging_table_count integer;
  function_count integer;
  trigger_count integer;
BEGIN
  IF current_setting('transaction_read_only') <> 'on' THEN
    RAISE EXCEPTION 'P22C-3C post-apply verification must be read only';
  END IF;

  SELECT count(*)::integer
  INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'menu_collections',
      'menu_collection_sections',
      'menu_collection_products',
      'product_nutrition_profiles',
      'product_allergen_profiles',
      'menu_collection_revisions',
      'menu_publications',
      'menu_role_permissions'
    );

  IF table_count <> 8 THEN
    RAISE EXCEPTION 'Expected 8 authority tables, found %', table_count;
  END IF;

  SELECT count(*)::integer
  INTO enum_count
  FROM pg_type type_info
  JOIN pg_namespace namespace_info
    ON namespace_info.oid = type_info.typnamespace
  WHERE namespace_info.nspname = 'public'
    AND type_info.typname IN (
      'MenuCollectionKind',
      'MenuCollectionStatus',
      'MenuMembershipSource',
      'FoodDataVerificationStatus',
      'MenuPublicationStatus',
      'MenuCollectionPermission'
    );

  IF enum_count <> 6 THEN
    RAISE EXCEPTION 'Expected 6 authority enum types, found %', enum_count;
  END IF;

  SELECT count(*)::integer
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'menu_collections',
      'menu_collection_sections',
      'menu_collection_products',
      'product_nutrition_profiles',
      'product_allergen_profiles',
      'menu_collection_revisions',
      'menu_publications',
      'menu_role_permissions'
    );

  IF policy_count <> 24 THEN
    RAISE EXCEPTION 'Expected 24 authority policies, found %', policy_count;
  END IF;

  SELECT count(*)::integer
  INTO rls_count
  FROM pg_class class_info
  JOIN pg_namespace namespace_info
    ON namespace_info.oid = class_info.relnamespace
  WHERE namespace_info.nspname = 'public'
    AND class_info.relname IN (
      'menu_collections',
      'menu_collection_sections',
      'menu_collection_products',
      'product_nutrition_profiles',
      'product_allergen_profiles',
      'menu_collection_revisions',
      'menu_publications',
      'menu_role_permissions'
    )
    AND class_info.relrowsecurity;

  IF rls_count <> 8 THEN
    RAISE EXCEPTION 'RLS is not enabled on all 8 authority tables';
  END IF;

  SELECT
    (SELECT count(*) FROM public.menu_collections) +
    (SELECT count(*) FROM public.menu_collection_sections) +
    (SELECT count(*) FROM public.menu_collection_products) +
    (SELECT count(*) FROM public.product_nutrition_profiles) +
    (SELECT count(*) FROM public.product_allergen_profiles) +
    (SELECT count(*) FROM public.menu_collection_revisions) +
    (SELECT count(*) FROM public.menu_publications) +
    (SELECT count(*) FROM public.menu_role_permissions)
  INTO authority_rows;

  IF authority_rows <> 0 THEN
    RAISE EXCEPTION 'P22C-3C schema-only authority tables must remain empty; found % rows', authority_rows;
  END IF;

  SELECT count(*)::integer
  INTO security_definer_count
  FROM pg_proc procedure_info
  JOIN pg_namespace namespace_info
    ON namespace_info.oid = procedure_info.pronamespace
  WHERE namespace_info.nspname = 'public'
    AND procedure_info.proname IN (
      'salora_menu_has_permission',
      'salora_menu_transition_allowed',
      'salora_enforce_menu_collection_transition',
      'salora_enforce_food_profile_review',
      'salora_prevent_menu_revision_mutation',
      'salora_validate_active_menu_revision',
      'salora_touch_updated_at'
    )
    AND procedure_info.prosecdef;

  IF security_definer_count <> 0 THEN
    RAISE EXCEPTION 'Authority helper functions must not use SECURITY DEFINER';
  END IF;

  SELECT count(DISTINCT procedure_info.proname)::integer
  INTO function_count
  FROM pg_proc procedure_info
  JOIN pg_namespace namespace_info
    ON namespace_info.oid = procedure_info.pronamespace
  WHERE namespace_info.nspname = 'public'
    AND procedure_info.proname IN (
      'salora_menu_has_permission',
      'salora_menu_transition_allowed',
      'salora_enforce_menu_collection_transition',
      'salora_enforce_food_profile_review',
      'salora_prevent_menu_revision_mutation',
      'salora_validate_active_menu_revision',
      'salora_touch_updated_at'
    );

  IF function_count <> 7 THEN
    RAISE EXCEPTION 'Expected 7 authority functions, found %', function_count;
  END IF;

  SELECT count(*)::integer
  INTO trigger_count
  FROM pg_trigger trigger_info
  JOIN pg_class table_info
    ON table_info.oid = trigger_info.tgrelid
  JOIN pg_namespace namespace_info
    ON namespace_info.oid = table_info.relnamespace
  WHERE namespace_info.nspname = 'public'
    AND table_info.relname IN (
      'menu_collections',
      'menu_collection_sections',
      'menu_collection_products',
      'product_nutrition_profiles',
      'product_allergen_profiles',
      'menu_collection_revisions',
      'menu_publications',
      'menu_role_permissions'
    )
    AND NOT trigger_info.tgisinternal;

  IF trigger_count <> 11 THEN
    RAISE EXCEPTION 'Expected 11 authority triggers, found %', trigger_count;
  END IF;

  IF to_regclass('public.menu_collection_products_collection_id_section_id_sort_order_id') IS NULL THEN
    RAISE EXCEPTION 'PostgreSQL-normalized membership ordering index is missing';
  END IF;

  SELECT count(*)::integer
  INTO staging_table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN (
      'staging_certification_metadata',
      'staging_menu_authority_metadata'
    );

  IF staging_table_count <> 0 THEN
    RAISE EXCEPTION 'Staging-only metadata tables must remain absent';
  END IF;
END;
$p22c3c_post_apply$;

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
    COALESCE(jsonb_agg(slug ORDER BY slug), '[]'::jsonb) AS slugs
  FROM public.product_categories
  WHERE brand_key = 'SALORA'
)
SELECT jsonb_build_object(
  'phase', 'P22C-3C',
  'mode', 'POST_APPLY_VERIFY_READ_ONLY',
  'capturedAt', clock_timestamp(),
  'database', current_database(),
  'currentUser', current_user,
  'serverVersion', current_setting('server_version'),
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
  'authority', jsonb_build_object(
    'tables', 8,
    'enums', 6,
    'policies', 24,
    'rlsEnabledTables', 8,
    'functions', 7,
    'triggers', 11,
    'rows', 0,
    'identifierMaxBytes', 63,
    'identifierCollisions', 0
  )
)::text
FROM product_state
CROSS JOIN category_state;

ROLLBACK;
