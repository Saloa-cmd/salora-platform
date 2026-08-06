\set ON_ERROR_STOP on

-- P22C-3C rollback artifact.
-- NOT AUTHORIZED FOR PRODUCTION EXECUTION.
-- A separate final rollback approval must set the session variable below before this file is used:
--   SET salora.p22c3c_rollback_approval = 'P22C-3C-ROLLBACK-FINAL-APPROVAL';
-- This rollback is intentionally fail-closed when any authority data exists.

BEGIN;

DO $p22c3c_rollback_guard$
DECLARE
  approval text;
  missing_tables text[] := ARRAY[]::text[];
  object_name text;
  authority_rows bigint;
BEGIN
  approval := current_setting('salora.p22c3c_rollback_approval', true);

  IF approval IS DISTINCT FROM 'P22C-3C-ROLLBACK-FINAL-APPROVAL' THEN
    RAISE EXCEPTION 'P22C-3C rollback approval token is missing';
  END IF;

  FOREACH object_name IN ARRAY ARRAY[
    'menu_collections',
    'menu_collection_sections',
    'menu_collection_products',
    'product_nutrition_profiles',
    'product_allergen_profiles',
    'menu_collection_revisions',
    'menu_publications',
    'menu_role_permissions'
  ]
  LOOP
    IF to_regclass(format('public.%I', object_name)) IS NULL THEN
      missing_tables := array_append(missing_tables, object_name);
    END IF;
  END LOOP;

  IF cardinality(missing_tables) > 0 THEN
    RAISE EXCEPTION 'P22C-3C rollback requires the complete authority schema; missing %', array_to_string(missing_tables, ', ');
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
    RAISE EXCEPTION
      'P22C-3C rollback is permitted only before P22C-3D data creation; found % authority rows',
      authority_rows;
  END IF;
END;
$p22c3c_rollback_guard$;

DO $p22c3c_drop_triggers$
DECLARE
  trigger_row record;
BEGIN
  FOR trigger_row IN
    SELECT
      trigger_info.tgname,
      table_info.relname
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
      AND NOT trigger_info.tgisinternal
  LOOP
    EXECUTE format(
      'DROP TRIGGER %I ON public.%I',
      trigger_row.tgname,
      trigger_row.relname
    );
  END LOOP;
END;
$p22c3c_drop_triggers$;

DROP FUNCTION IF EXISTS public.salora_menu_has_permission(text);
DROP FUNCTION IF EXISTS public.salora_menu_transition_allowed(text, text);
DROP FUNCTION IF EXISTS public.salora_enforce_menu_collection_transition();
DROP FUNCTION IF EXISTS public.salora_enforce_food_profile_review();
DROP FUNCTION IF EXISTS public.salora_prevent_menu_revision_mutation();
DROP FUNCTION IF EXISTS public.salora_validate_active_menu_revision();
DROP FUNCTION IF EXISTS public.salora_touch_updated_at();

ALTER TABLE public.menu_collections
  DROP CONSTRAINT IF EXISTS menu_collections_active_revision_id_fkey;

DROP TABLE public.menu_publications;
DROP TABLE public.menu_collection_products;
DROP TABLE public.menu_collection_sections;
DROP TABLE public.product_nutrition_profiles;
DROP TABLE public.product_allergen_profiles;
DROP TABLE public.menu_role_permissions;
DROP TABLE public.menu_collection_revisions;
DROP TABLE public.menu_collections;

DROP TYPE public."MenuCollectionPermission";
DROP TYPE public."MenuPublicationStatus";
DROP TYPE public."FoodDataVerificationStatus";
DROP TYPE public."MenuMembershipSource";
DROP TYPE public."MenuCollectionStatus";
DROP TYPE public."MenuCollectionKind";

COMMIT;
