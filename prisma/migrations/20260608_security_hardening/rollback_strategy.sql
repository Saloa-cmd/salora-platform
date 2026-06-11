-- SALORA RLS rollback strategy
-- Date: 2026-06-08
-- Status: REVIEW ONLY. DO NOT EXECUTE WITHOUT INCIDENT APPROVAL.

begin;

-- Emergency containment rollback:
-- Disable RLS only if approved and only after confirming application outage is caused by RLS.
-- alter table public.users disable row level security;
-- alter table public.roles disable row level security;
-- alter table public.user_roles disable row level security;
-- alter table public.sessions disable row level security;
-- alter table public.customer_profiles disable row level security;
-- alter table public.customer_addresses disable row level security;
-- alter table public.customer_preferences disable row level security;
-- alter table public.product_categories disable row level security;
-- alter table public.catalog_products disable row level security;
-- alter table public.product_images disable row level security;
-- alter table public.product_media_drafts disable row level security;
-- alter table public.cafe_orders disable row level security;
-- alter table public.order_items disable row level security;
-- alter table public.order_notes disable row level security;
-- alter table public.order_timeline disable row level security;
-- alter table public.activity_logs disable row level security;
-- alter table public.audit_logs disable row level security;
-- alter table public.whatsapp_webhook_events disable row level security;
-- alter table public.notifications disable row level security;

-- Preferred rollback:
-- Restore the latest pre-hardening Supabase backup, then redeploy the last known good application.

commit;
