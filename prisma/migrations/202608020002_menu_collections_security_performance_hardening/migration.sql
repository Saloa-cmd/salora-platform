-- SALORA P21A — Menu Collections Security & Performance Hardening
-- Additive follow-up to 202608020001_menu_collections_domain_foundation.
-- No product, category, price, media, inventory, order, customer, or payment data is mutated.

BEGIN;

CREATE INDEX IF NOT EXISTS "menu_collection_products_section_id_idx"
  ON public."menu_collection_products"("section_id");

ALTER FUNCTION public.salora_jwt_roles() SECURITY INVOKER;
ALTER FUNCTION public.salora_is_staff() SECURITY INVOKER;
ALTER FUNCTION public.salora_is_manager() SECURITY INVOKER;
ALTER FUNCTION public.salora_is_admin() SECURITY INVOKER;
ALTER FUNCTION public.salora_menu_has_permission(text) SECURITY INVOKER;

ALTER FUNCTION public.salora_jwt_roles()
  SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.salora_is_staff()
  SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.salora_is_manager()
  SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.salora_is_admin()
  SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.salora_menu_has_permission(text)
  SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.salora_menu_transition_allowed(text, text)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.salora_enforce_menu_collection_transition()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.salora_enforce_food_profile_review()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.salora_prevent_menu_revision_mutation()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.salora_validate_active_menu_revision()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.salora_touch_updated_at()
  SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.salora_jwt_roles()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salora_is_staff()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salora_is_manager()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salora_is_admin()
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.salora_menu_has_permission(text)
  TO anon, authenticated, service_role;

GRANT SELECT ON public."menu_role_permissions"
  TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public."menu_role_permissions"
  TO authenticated;

DROP POLICY IF EXISTS "menu_role_permissions_admin_write"
  ON public."menu_role_permissions";

DROP POLICY IF EXISTS "menu_role_permissions_admin_insert"
  ON public."menu_role_permissions";
CREATE POLICY "menu_role_permissions_admin_insert"
ON public."menu_role_permissions"
FOR INSERT TO authenticated
WITH CHECK (public.salora_is_admin());

DROP POLICY IF EXISTS "menu_role_permissions_admin_update"
  ON public."menu_role_permissions";
CREATE POLICY "menu_role_permissions_admin_update"
ON public."menu_role_permissions"
FOR UPDATE TO authenticated
USING (public.salora_is_admin())
WITH CHECK (public.salora_is_admin());

DROP POLICY IF EXISTS "menu_role_permissions_admin_delete"
  ON public."menu_role_permissions";
CREATE POLICY "menu_role_permissions_admin_delete"
ON public."menu_role_permissions"
FOR DELETE TO authenticated
USING (public.salora_is_admin());

COMMIT;
