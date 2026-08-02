-- SALORA P21 rollback plan
-- REVIEW ONLY. DESTRUCTIVE. DO NOT RUN ON PRODUCTION WITHOUT:
-- 1) verified backup, 2) exported P21 data, 3) change approval, 4) maintenance window.
--
-- This file is intentionally not referenced by any script.

BEGIN;

DROP TABLE IF EXISTS public.menu_publications;
DROP TABLE IF EXISTS public.menu_collection_revisions;
DROP TABLE IF EXISTS public.menu_collection_products;
DROP TABLE IF EXISTS public.menu_collection_sections;
DROP TABLE IF EXISTS public.product_allergen_profiles;
DROP TABLE IF EXISTS public.product_nutrition_profiles;
DROP TABLE IF EXISTS public.menu_collections;
DROP TABLE IF EXISTS public.menu_role_permissions;

DROP FUNCTION IF EXISTS public.salora_validate_active_menu_revision();
DROP FUNCTION IF EXISTS public.salora_prevent_menu_revision_mutation();
DROP FUNCTION IF EXISTS public.salora_enforce_food_profile_review();
DROP FUNCTION IF EXISTS public.salora_enforce_menu_collection_transition();
DROP FUNCTION IF EXISTS public.salora_menu_transition_allowed(text, text);
DROP FUNCTION IF EXISTS public.salora_menu_has_permission(text);
DROP FUNCTION IF EXISTS public.salora_touch_updated_at();

DROP TYPE IF EXISTS "MenuCollectionPermission";
DROP TYPE IF EXISTS "MenuPublicationStatus";
DROP TYPE IF EXISTS "FoodDataVerificationStatus";
DROP TYPE IF EXISTS "MenuMembershipSource";
DROP TYPE IF EXISTS "MenuCollectionStatus";
DROP TYPE IF EXISTS "MenuCollectionKind";

ROLLBACK;
