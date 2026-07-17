-- Cache auth.uid() once per statement in owner-aware RLS policies.
-- Authorization predicates are otherwise unchanged.

begin;

alter policy "users_self_read" on public.users
  using (id = (select auth.uid()) or public.salora_is_admin());

alter policy "sessions_owner_or_admin" on public.sessions
  using (user_id = (select auth.uid()) or public.salora_is_admin());
alter policy "sessions_owner_update_or_admin" on public.sessions
  using (user_id = (select auth.uid()) or public.salora_is_admin())
  with check (user_id = (select auth.uid()) or public.salora_is_admin());

alter policy "customer_profiles_owner_staff_read" on public.customer_profiles
  using (user_id = (select auth.uid()) or public.salora_is_staff());
alter policy "customer_profiles_owner_manager_write" on public.customer_profiles
  using (user_id = (select auth.uid()) or public.salora_is_manager())
  with check (user_id = (select auth.uid()) or public.salora_is_manager());

alter policy "customer_addresses_owner_staff_read" on public.customer_addresses
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and (cp.user_id = (select auth.uid()) or public.salora_is_staff())));
alter policy "customer_addresses_owner_write" on public.customer_addresses
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())))
  with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "customer_preferences_owner_only" on public.customer_preferences
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())))
  with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));

alter policy "coupon_redemptions_owner_manager_read" on public.coupon_redemptions
  using (public.salora_is_manager() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));

alter policy "cafe_orders_owner_staff_read" on public.cafe_orders
  using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "order_items_owner_staff_read" on public.order_items
  using (public.salora_is_staff() or exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = (select auth.uid())));
alter policy "order_timeline_owner_staff_read" on public.order_timeline
  using (public.salora_is_staff() or exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = (select auth.uid())));
alter policy "order_notes_owner_public_notes_staff_all" on public.order_notes
  using (public.salora_is_staff() or (is_staff = false and exists (select 1 from public.cafe_orders o join public.customer_profiles cp on cp.id = o.customer_id where o.id = order_id and cp.user_id = (select auth.uid()))));

alter policy "notifications_owner_read" on public.notifications
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())) or public.salora_is_staff());
alter policy "customer_favorites_owner_only" on public.customer_favorites
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())))
  with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "saved_orders_owner_only" on public.saved_orders
  using (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())))
  with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "product_reviews_owner_staff_write" on public.product_reviews
  using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())))
  with check (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "conversations_owner_staff" on public.conversations
  using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "conversation_messages_owner_staff" on public.conversation_messages
  using (public.salora_is_staff() or exists (select 1 from public.conversations c join public.customer_profiles cp on cp.id = c.customer_id where c.id = conversation_id and cp.user_id = (select auth.uid())));
alter policy "ai_recommendation_owner_manager" on public.ai_recommendation_records
  using (public.salora_is_manager() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));

alter policy "loyalty_accounts_owner_staff_read" on public.loyalty_accounts
  using (public.salora_is_staff() or exists (select 1 from public.customer_profiles cp where cp.id = customer_id and cp.user_id = (select auth.uid())));
alter policy "loyalty_ledger_owner_staff_read" on public.loyalty_ledger_entries
  using (public.salora_is_staff() or exists (select 1 from public.loyalty_accounts la join public.customer_profiles cp on cp.id = la.customer_id where la.id = account_id and cp.user_id = (select auth.uid())));
alter policy "reward_redemptions_owner_staff_read" on public.reward_redemptions
  using (public.salora_is_staff() or exists (select 1 from public.loyalty_accounts la join public.customer_profiles cp on cp.id = la.customer_id where la.id = account_id and cp.user_id = (select auth.uid())));

commit;
