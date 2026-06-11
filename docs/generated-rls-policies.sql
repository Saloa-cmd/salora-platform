-- SALORA generated RLS policies
-- Date: 2026-06-08
-- Status: REVIEW ONLY. DO NOT EXECUTE WITHOUT HUMAN APPROVAL AND BACKUP.
-- Backup recommendation: Supabase -> Settings -> Database -> Backups.

begin;

create or replace function public.salora_jwt_roles()
returns text[]
language sql
stable
as $$
  with roles_array as (
    select array(
      select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb))
    ) as roles
  )
  select case
    when coalesce(array_length(roles, 1), 0) > 0 then roles
    when auth.jwt() -> 'app_metadata' ? 'role' then array[auth.jwt() -> 'app_metadata' ->> 'role']
    else array[]::text[]
  end
  from roles_array;
$$;

create or replace function public.salora_has_role(required_roles text[])
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role'
    or exists (
      select 1
      from unnest(public.salora_jwt_roles()) as role_name
      where upper(role_name) = any(required_roles)
    );
$$;

create or replace function public.salora_is_staff()
returns boolean
language sql
stable
as $$ select public.salora_has_role(array['STAFF','MANAGER','ADMIN']); $$;

create or replace function public.salora_is_manager()
returns boolean
language sql
stable
as $$ select public.salora_has_role(array['MANAGER','ADMIN']); $$;

create or replace function public.salora_is_admin()
returns boolean
language sql
stable
as $$ select public.salora_has_role(array['ADMIN']); $$;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.sessions enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.product_categories enable row level security;
alter table public.catalog_products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_media_drafts enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_addons enable row level security;
alter table public.product_modifiers enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.availability_rules enable row level security;
alter table public.customer_favorites enable row level security;
alter table public.saved_orders enable row level security;
alter table public.cafe_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_timeline enable row level security;
alter table public.order_notes enable row level security;
alter table public.payments enable row level security;
alter table public.payment_intents enable row level security;
alter table public.refunds enable row level security;
alter table public.payment_events enable row level security;
alter table public.payment_method_references enable row level security;
alter table public.payment_audit_logs enable row level security;
alter table public.payment_reconciliation_records enable row level security;
alter table public.product_reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.channel_sessions enable row level security;
alter table public.provider_messages enable row level security;
alter table public.whatsapp_webhook_events enable row level security;
alter table public.ai_evaluation_records enable row level security;
alter table public.ai_recommendation_records enable row level security;
alter table public.suppliers enable row level security;
alter table public.ingredients enable row level security;
alter table public.stock_movements enable row level security;
alter table public.consumption_records enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_ledger_entries enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_delivery_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.runtime_configurations enable row level security;

-- Idempotent policy replacement guard.
-- These drops make staging re-runs deterministic while preserving table data.
drop policy if exists "users_self_read" on public.users;
drop policy if exists "users_admin_write" on public.users;
drop policy if exists "roles_authenticated_read" on public.roles;
drop policy if exists "roles_admin_write" on public.roles;
drop policy if exists "user_roles_admin_only" on public.user_roles;
drop policy if exists "sessions_owner_or_admin" on public.sessions;
drop policy if exists "sessions_owner_update_or_admin" on public.sessions;
drop policy if exists "customer_profiles_owner_staff_read" on public.customer_profiles;
drop policy if exists "customer_profiles_owner_manager_write" on public.customer_profiles;
drop policy if exists "customer_addresses_owner_staff_read" on public.customer_addresses;
drop policy if exists "customer_addresses_owner_write" on public.customer_addresses;
drop policy if exists "customer_preferences_owner_only" on public.customer_preferences;
drop policy if exists "product_categories_public_read" on public.product_categories;
drop policy if exists "product_categories_manager_write" on public.product_categories;
drop policy if exists "catalog_products_public_active_read" on public.catalog_products;
drop policy if exists "catalog_products_manager_write" on public.catalog_products;
drop policy if exists "product_images_public_active_read" on public.product_images;
drop policy if exists "product_images_manager_write" on public.product_images;
drop policy if exists "product_variants_public_active_read" on public.product_variants;
drop policy if exists "product_addons_public_active_read" on public.product_addons;
drop policy if exists "product_modifiers_public_active_read" on public.product_modifiers;
drop policy if exists "catalog_children_manager_write" on public.product_variants;
drop policy if exists "product_addons_manager_write" on public.product_addons;
drop policy if exists "product_modifiers_manager_write" on public.product_modifiers;
drop policy if exists "availability_rules_public_active_read" on public.availability_rules;
drop policy if exists "availability_rules_manager_write" on public.availability_rules;
drop policy if exists "pricing_rules_staff_read" on public.pricing_rules;
drop policy if exists "pricing_rules_manager_write" on public.pricing_rules;
drop policy if exists "coupons_public_active_read" on public.coupons;
drop policy if exists "coupons_manager_write" on public.coupons;
drop policy if exists "coupon_redemptions_owner_manager_read" on public.coupon_redemptions;
drop policy if exists "coupon_redemptions_service_or_manager_write" on public.coupon_redemptions;
drop policy if exists "promotions_public_active_read" on public.promotions;
drop policy if exists "promotions_manager_write" on public.promotions;
drop policy if exists "promotion_products_public_active_read" on public.promotion_products;
drop policy if exists "promotion_products_manager_write" on public.promotion_products;
drop policy if exists "cafe_orders_owner_staff_read" on public.cafe_orders;
drop policy if exists "cafe_orders_staff_update" on public.cafe_orders;
drop policy if exists "order_items_owner_staff_read" on public.order_items;
drop policy if exists "order_items_staff_write" on public.order_items;
drop policy if exists "order_timeline_owner_staff_read" on public.order_timeline;
drop policy if exists "order_timeline_staff_write" on public.order_timeline;
drop policy if exists "order_notes_owner_public_notes_staff_all" on public.order_notes;
drop policy if exists "order_notes_staff_write" on public.order_notes;
drop policy if exists "product_media_drafts_staff_read" on public.product_media_drafts;
drop policy if exists "product_media_drafts_manager_write" on public.product_media_drafts;
drop policy if exists "whatsapp_webhook_events_service_only" on public.whatsapp_webhook_events;
drop policy if exists "provider_messages_service_only" on public.provider_messages;
drop policy if exists "channel_sessions_service_only" on public.channel_sessions;
drop policy if exists "notifications_owner_read" on public.notifications;
drop policy if exists "notifications_service_only_write" on public.notifications;
drop policy if exists "notification_templates_manager_only" on public.notification_templates;
drop policy if exists "notification_delivery_logs_service_only" on public.notification_delivery_logs;
drop policy if exists "activity_logs_manager_read" on public.activity_logs;
drop policy if exists "activity_logs_service_write" on public.activity_logs;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
drop policy if exists "audit_logs_service_write" on public.audit_logs;
drop policy if exists "feature_flags_admin_only" on public.feature_flags;
drop policy if exists "runtime_configurations_admin_only" on public.runtime_configurations;
drop policy if exists "payments_service_only" on public.payments;
drop policy if exists "payment_intents_service_only" on public.payment_intents;
drop policy if exists "refunds_manager_read_service_write" on public.refunds;
drop policy if exists "refunds_service_write" on public.refunds;
drop policy if exists "payment_events_service_only" on public.payment_events;
drop policy if exists "payment_method_references_service_only" on public.payment_method_references;
drop policy if exists "payment_audit_logs_admin_read" on public.payment_audit_logs;
drop policy if exists "payment_audit_logs_service_write" on public.payment_audit_logs;
drop policy if exists "payment_reconciliation_manager_only" on public.payment_reconciliation_records;
drop policy if exists "customer_favorites_owner_only" on public.customer_favorites;
drop policy if exists "saved_orders_owner_only" on public.saved_orders;
drop policy if exists "product_reviews_public_approved_read" on public.product_reviews;
drop policy if exists "product_reviews_owner_staff_write" on public.product_reviews;
drop policy if exists "conversations_owner_staff" on public.conversations;
drop policy if exists "conversation_messages_owner_staff" on public.conversation_messages;
drop policy if exists "conversation_messages_service_write" on public.conversation_messages;
drop policy if exists "ai_evaluation_records_manager_only" on public.ai_evaluation_records;
drop policy if exists "ai_recommendation_owner_manager" on public.ai_recommendation_records;
drop policy if exists "ai_recommendation_service_write" on public.ai_recommendation_records;
drop policy if exists "suppliers_manager_only" on public.suppliers;
drop policy if exists "ingredients_staff_read_manager_write" on public.ingredients;
drop policy if exists "ingredients_manager_write" on public.ingredients;
drop policy if exists "stock_movements_staff_read_manager_write" on public.stock_movements;
drop policy if exists "stock_movements_manager_write" on public.stock_movements;
drop policy if exists "consumption_records_staff_only" on public.consumption_records;
drop policy if exists "loyalty_accounts_owner_staff_read" on public.loyalty_accounts;
drop policy if exists "loyalty_ledger_owner_staff_read" on public.loyalty_ledger_entries;
drop policy if exists "rewards_public_read" on public.rewards;
drop policy if exists "rewards_manager_write" on public.rewards;
drop policy if exists "reward_redemptions_owner_staff_read" on public.reward_redemptions;

-- Auth and RBAC
create policy "users_self_read" on public.users for select to authenticated using (id = auth.uid() or public.salora_is_admin());
create policy "users_admin_write" on public.users for all to authenticated using (public.salora_is_admin()) with check (public.salora_is_admin());
create policy "roles_authenticated_read" on public.roles for select to authenticated using (true);
create policy "roles_admin_write" on public.roles for all to authenticated using (public.salora_is_admin()) with check (public.salora_is_admin());
create policy "user_roles_admin_only" on public.user_roles for all to authenticated using (public.salora_is_admin()) with check (public.salora_is_admin());
create policy "sessions_owner_or_admin" on public.sessions for select to authenticated using (user_id = auth.uid() or public.salora_is_admin());
create policy "sessions_owner_update_or_admin" on public.sessions for update to authenticated using (user_id = auth.uid() or public.salora_is_admin()) with check (user_id = auth.uid() or public.salora_is_admin());

-- Customer data
create policy "customer_profiles_owner_staff_read" on public.customer_profiles for select to authenticated using (user_id = auth.uid() or public.salora_is_staff());
create policy "customer_profiles_owner_manager_write" on public.customer_profiles for all to authenticated using (user_id = auth.uid() or public.salora_is_manager()) with check (user_id = auth.uid() or public.salora_is_manager());
create policy "customer_addresses_owner_staff_read" on public.customer_addresses for select to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and (cp.user_id = auth.uid() or public.salora_is_staff())));
create policy "customer_addresses_owner_write" on public.customer_addresses for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "customer_preferences_owner_only" on public.customer_preferences for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));

-- Public catalog
create policy "product_categories_public_read" on public.product_categories for select to anon, authenticated using (true);
create policy "product_categories_manager_write" on public.product_categories for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "catalog_products_public_active_read" on public.catalog_products for select to anon, authenticated using (status = 'ACTIVE');
create policy "catalog_products_manager_write" on public.catalog_products for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "product_images_public_active_read" on public.product_images for select to anon, authenticated using (deleted_at is null and archived_at is null and exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "product_images_manager_write" on public.product_images for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "product_variants_public_active_read" on public.product_variants for select to anon, authenticated using (exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "product_addons_public_active_read" on public.product_addons for select to anon, authenticated using (exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "product_modifiers_public_active_read" on public.product_modifiers for select to anon, authenticated using (exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "catalog_children_manager_write" on public.product_variants for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "product_addons_manager_write" on public.product_addons for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "product_modifiers_manager_write" on public.product_modifiers for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "availability_rules_public_active_read" on public.availability_rules for select to anon, authenticated using (exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "availability_rules_manager_write" on public.availability_rules for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());

-- Pricing, coupons, promotions
create policy "pricing_rules_staff_read" on public.pricing_rules for select to authenticated using (public.salora_is_staff());
create policy "pricing_rules_manager_write" on public.pricing_rules for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "coupons_public_active_read" on public.coupons for select to anon, authenticated using (is_active = true and deleted_at is null and archived_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "coupons_manager_write" on public.coupons for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "coupon_redemptions_owner_manager_read" on public.coupon_redemptions for select to authenticated using (public.salora_is_manager() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "coupon_redemptions_service_or_manager_write" on public.coupon_redemptions for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "promotions_public_active_read" on public.promotions for select to anon, authenticated using (status = 'ACTIVE' and deleted_at is null and archived_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "promotions_manager_write" on public.promotions for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "promotion_products_public_active_read" on public.promotion_products for select to anon, authenticated using (exists (select 1 from public.promotions pr where pr.id = promotion_id and pr.status = 'ACTIVE' and pr.deleted_at is null and pr.archived_at is null) and exists (select 1 from public.catalog_products p where p.id = product_id and p.status = 'ACTIVE'));
create policy "promotion_products_manager_write" on public.promotion_products for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());

-- Orders
create policy "cafe_orders_owner_staff_read" on public.cafe_orders for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "cafe_orders_staff_update" on public.cafe_orders for update to authenticated using (public.salora_is_staff()) with check (public.salora_is_staff());
create policy "order_items_owner_staff_read" on public.order_items for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = auth.uid()));
create policy "order_items_staff_write" on public.order_items for all to authenticated using (public.salora_is_staff()) with check (public.salora_is_staff());
create policy "order_timeline_owner_staff_read" on public.order_timeline for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = auth.uid()));
create policy "order_timeline_staff_write" on public.order_timeline for all to authenticated using (public.salora_is_staff()) with check (public.salora_is_staff());
create policy "order_notes_owner_public_notes_staff_all" on public.order_notes for select to authenticated using (public.salora_is_staff() or (is_staff = false and exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = auth.uid())));
create policy "order_notes_staff_write" on public.order_notes for all to authenticated using (public.salora_is_staff()) with check (public.salora_is_staff());

-- Media workflow
create policy "product_media_drafts_staff_read" on public.product_media_drafts for select to authenticated using (public.salora_is_staff());
create policy "product_media_drafts_manager_write" on public.product_media_drafts for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());

-- WhatsApp and provider events
create policy "whatsapp_webhook_events_service_only" on public.whatsapp_webhook_events for all to service_role using (true) with check (true);
create policy "provider_messages_service_only" on public.provider_messages for all to service_role using (true) with check (true);
create policy "channel_sessions_service_only" on public.channel_sessions for all to service_role using (true) with check (true);

-- Notifications
create policy "notifications_owner_read" on public.notifications for select to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()) or public.salora_is_staff());
create policy "notifications_service_only_write" on public.notifications for all to service_role using (true) with check (true);
create policy "notification_templates_manager_only" on public.notification_templates for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "notification_delivery_logs_service_only" on public.notification_delivery_logs for all to service_role using (true) with check (true);

-- Logs and governance
create policy "activity_logs_manager_read" on public.activity_logs for select to authenticated using (public.salora_is_manager());
create policy "activity_logs_service_write" on public.activity_logs for all to service_role using (true) with check (true);
create policy "audit_logs_admin_read" on public.audit_logs for select to authenticated using (public.salora_is_admin());
create policy "audit_logs_service_write" on public.audit_logs for all to service_role using (true) with check (true);
create policy "feature_flags_admin_only" on public.feature_flags for all to authenticated using (public.salora_is_admin()) with check (public.salora_is_admin());
create policy "runtime_configurations_admin_only" on public.runtime_configurations for all to authenticated using (public.salora_is_admin()) with check (public.salora_is_admin());

-- Service-only sensitive operational tables.
create policy "payments_service_only" on public.payments for all to service_role using (true) with check (true);
create policy "payment_intents_service_only" on public.payment_intents for all to service_role using (true) with check (true);
create policy "refunds_manager_read_service_write" on public.refunds for select to authenticated using (public.salora_is_manager());
create policy "refunds_service_write" on public.refunds for all to service_role using (true) with check (true);
create policy "payment_events_service_only" on public.payment_events for all to service_role using (true) with check (true);
create policy "payment_method_references_service_only" on public.payment_method_references for all to service_role using (true) with check (true);
create policy "payment_audit_logs_admin_read" on public.payment_audit_logs for select to authenticated using (public.salora_is_admin());
create policy "payment_audit_logs_service_write" on public.payment_audit_logs for all to service_role using (true) with check (true);
create policy "payment_reconciliation_manager_only" on public.payment_reconciliation_records for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());

-- Remaining customer/operations tables.
create policy "customer_favorites_owner_only" on public.customer_favorites for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "saved_orders_owner_only" on public.saved_orders for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "product_reviews_public_approved_read" on public.product_reviews for select to anon, authenticated using (status = 'APPROVED' and deleted_at is null);
create policy "product_reviews_owner_staff_write" on public.product_reviews for all to authenticated using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid())) with check (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "conversations_owner_staff" on public.conversations for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "conversation_messages_owner_staff" on public.conversation_messages for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.conversations c join public.customer_profiles cp on cp.id = c.customer_id where c.id = conversation_id and cp.user_id = auth.uid()));
create policy "conversation_messages_service_write" on public.conversation_messages for all to service_role using (true) with check (true);
create policy "ai_evaluation_records_manager_only" on public.ai_evaluation_records for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "ai_recommendation_owner_manager" on public.ai_recommendation_records for select to authenticated using (public.salora_is_manager() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "ai_recommendation_service_write" on public.ai_recommendation_records for all to service_role using (true) with check (true);
create policy "suppliers_manager_only" on public.suppliers for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "ingredients_staff_read_manager_write" on public.ingredients for select to authenticated using (public.salora_is_staff());
create policy "ingredients_manager_write" on public.ingredients for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "stock_movements_staff_read_manager_write" on public.stock_movements for select to authenticated using (public.salora_is_staff());
create policy "stock_movements_manager_write" on public.stock_movements for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "consumption_records_staff_only" on public.consumption_records for all to authenticated using (public.salora_is_staff()) with check (public.salora_is_staff());
create policy "loyalty_accounts_owner_staff_read" on public.loyalty_accounts for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = auth.uid()));
create policy "loyalty_ledger_owner_staff_read" on public.loyalty_ledger_entries for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.loyalty_accounts la join public.customer_profiles cp on cp.id = la.customer_id where la.id = account_id and cp.user_id = auth.uid()));
create policy "rewards_public_read" on public.rewards for select to anon, authenticated using (is_active = true);
create policy "rewards_manager_write" on public.rewards for all to authenticated using (public.salora_is_manager()) with check (public.salora_is_manager());
create policy "reward_redemptions_owner_staff_read" on public.reward_redemptions for select to authenticated using (public.salora_is_staff() or exists (select 1 from public.loyalty_accounts la join public.customer_profiles cp on cp.id = la.customer_id where la.id = account_id and cp.user_id = auth.uid()));

comment on schema public is 'SALORA public schema: RLS hardening draft generated 2026-06-08. Execution requires backup and human approval.';

commit;
