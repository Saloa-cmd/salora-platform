\set ON_ERROR_STOP on

DROP TABLE IF EXISTS public.menu_publications CASCADE;
DROP TABLE IF EXISTS public.menu_collection_products CASCADE;
DROP TABLE IF EXISTS public.menu_collection_sections CASCADE;
DROP TABLE IF EXISTS public.product_nutrition_profiles CASCADE;
DROP TABLE IF EXISTS public.product_allergen_profiles CASCADE;
DROP TABLE IF EXISTS public.menu_role_permissions CASCADE;
DROP TABLE IF EXISTS public.menu_collections CASCADE;
DROP TABLE IF EXISTS public.menu_collection_revisions CASCADE;

DROP FUNCTION IF EXISTS public.salora_menu_has_permission(text);
DROP FUNCTION IF EXISTS public.salora_menu_transition_allowed(text, text);
DROP FUNCTION IF EXISTS public.salora_enforce_menu_collection_transition();
DROP FUNCTION IF EXISTS public.salora_enforce_food_profile_review();
DROP FUNCTION IF EXISTS public.salora_prevent_menu_revision_mutation();
DROP FUNCTION IF EXISTS public.salora_validate_active_menu_revision();
DROP FUNCTION IF EXISTS public.salora_touch_updated_at();

DROP TYPE IF EXISTS public."MenuCollectionPermission";
DROP TYPE IF EXISTS public."MenuPublicationStatus";
DROP TYPE IF EXISTS public."FoodDataVerificationStatus";
DROP TYPE IF EXISTS public."MenuMembershipSource";
DROP TYPE IF EXISTS public."MenuCollectionStatus";
DROP TYPE IF EXISTS public."MenuCollectionKind";
