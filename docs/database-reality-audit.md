# SALORA Database Reality Audit

Date: 2026-06-04  
Scope: `prisma/schema.prisma`, `prisma/migrations/*`, live Supabase read-only inspection through `DIRECT_URL`, code usage scan.

## Executive Finding

Database state is **PARTIAL**.

Evidence:
- `prisma validate`: PASS.
- `DATABASE_URL`: BLOCKED. Prisma connection through Supabase pooler returned `P1000 Authentication failed`.
- `DIRECT_URL`: ACTIVE. Safe read-only Prisma connection succeeded.
- Live Supabase deployed migrations contain only:
  - `202605310001_auth_foundation`
  - `202605310002_core_business_domains`
  - `202605310003_runtime_persistence`
  - `202605310004_revenue_platform`
  - `202606010001_runtime_configuration`
  - `202606030002_commercial_data_alignment_additive_only`
- Local migrations not deployed to Supabase:
  - `202606030003_control_tower_supremacy_launch`
  - `202606040001_whatsapp_enterprise_events`
- Live Supabase is missing tables that exist in Prisma and migrations:
  - `product_media_drafts`
  - `whatsapp_webhook_events`

## Runtime Connectivity

| Check | Status | Evidence |
|---|---:|---|
| Prisma schema validates | ACTIVE | `prisma/schema.prisma`; `pnpm prisma validate` passed in same workspace |
| Supabase direct connection | ACTIVE | Safe read-only query through `DIRECT_URL` returned public table list |
| Supabase pooler runtime connection | BLOCKED | `DATABASE_URL` produced Prisma `P1000 Authentication failed` |
| Service-role credentials | UNKNOWN | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` were not verified as usable in runtime |
| Deployed migration history | PARTIAL | `_prisma_migrations` lacks the latest two local migrations |

## Live Supabase Counts

Read-only evidence from `DIRECT_URL`:

| Table | Count / Result |
|---|---:|
| `catalog_products` | 96 |
| `product_categories` | 15 |
| `promotions` | 2 |
| `coupons` | 2 |
| `feature_flags` | 6 |
| `runtime_configurations` | 3 |
| `cafe_orders` | 0 |
| `customer_profiles` | 0 |
| `activity_logs` | 0 |
| `audit_logs` | 0 |
| `product_images` | 0 |
| `conversations` | 0 |
| `conversation_messages` | 0 |
| `provider_messages` | 0 |
| `ai_recommendation_records` | 0 |
| `ai_evaluation_records` | 0 |
| `payments` | 0 |
| `payment_intents` | 0 |
| `refunds` | 0 |
| `ingredients` | 0 |
| `stock_movements` | 0 |
| `product_media_drafts` | MISSING |
| `whatsapp_webhook_events` | MISSING |

## Table Reality Matrix

Status definitions:
- **ACTIVE**: exists in Prisma, migration, live Supabase, and has clear code usage.
- **PARTIAL**: exists but one production-readiness dependency is missing.
- **UNUSED**: exists in database but no direct application usage was found.
- **ORPHANED**: exists in one layer but not connected across required layers.
- **UNKNOWN**: evidence is insufficient.

| Table | Prisma | Migration | Supabase | Used by Code | Used by Control Tower | Status | Evidence |
|---|---:|---:|---:|---:|---:|---|---|
| `users` | YES | YES | YES | YES | PARTIAL | PARTIAL | `schema.prisma`, auth migration, auth/server modules |
| `customer_profiles` | YES | YES | YES | YES | YES | PARTIAL | live count 0; customers APIs and Control Tower customers section exist |
| `customer_addresses` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + migration + live table; no direct CRUD evidence found |
| `customer_preferences` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + migration + live table; no direct CRUD evidence found |
| `product_categories` | YES | YES | YES | YES | YES | ACTIVE | live count 15; public menu and Control Tower category APIs |
| `catalog_products` | YES | YES | YES | YES | YES | ACTIVE | live count 96; website, products API, Control Tower products |
| `product_images` | YES | YES | YES | YES | YES | PARTIAL | live count 0; media route references table |
| `product_media_drafts` | YES | YES | NO | YES | YES | ORPHANED | local migration exists; live Supabase table missing; AI/media routes reference it |
| `product_variants` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `product_addons` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `product_modifiers` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `pricing_rules` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `coupons` | YES | YES | YES | YES | YES | ACTIVE | live count 2; Control Tower coupons API |
| `coupon_redemptions` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no redemption flow evidence |
| `promotions` | YES | YES | YES | YES | YES | ACTIVE | live count 2; Control Tower promotions API |
| `promotion_products` | YES | YES | YES | YES | YES | PARTIAL | relationship table exists; production promotion surface incomplete on website |
| `availability_rules` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `customer_favorites` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no mobile/web favorites flow evidence |
| `saved_orders` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no saved order flow evidence |
| `cafe_orders` | YES | YES | YES | YES | YES | PARTIAL | live count 0; orders API exists; runtime DB pooler blocked |
| `payments` | YES | YES | YES | YES | PARTIAL | PARTIAL | payment routes exist; live count 0; Stripe runtime disabled/mock |
| `payment_intents` | YES | YES | YES | YES | PARTIAL | PARTIAL | payment domain references table; live count 0 |
| `refunds` | YES | YES | YES | YES | PARTIAL | PARTIAL | refund table exists; no live payment evidence |
| `payment_events` | YES | YES | YES | YES | PARTIAL | PARTIAL | webhook/payment event routes exist; no live event evidence |
| `payment_method_references` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime CRUD found |
| `payment_audit_logs` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no live payment activity |
| `payment_reconciliation_records` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no reconciliation job evidence |
| `product_reviews` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no review UI/API evidence |
| `conversations` | YES | YES | YES | YES | YES | PARTIAL | live count 0; WhatsApp/AI conversation routes exist; runtime DB blocked |
| `conversation_messages` | YES | YES | YES | YES | YES | PARTIAL | live count 0; WhatsApp routes reference table |
| `channel_sessions` | YES | YES | YES | UNKNOWN | PARTIAL | UNUSED | schema + live table; no verified session workflow |
| `provider_messages` | YES | YES | YES | YES | YES | PARTIAL | live count 0; delivery/read updates cannot be verified |
| `whatsapp_webhook_events` | YES | YES | NO | YES | YES | ORPHANED | Prisma + local migration only; live table missing |
| `ai_evaluation_records` | YES | YES | YES | YES | YES | PARTIAL | live count 0; AI evaluation code exists, no persisted evidence |
| `ai_recommendation_records` | YES | YES | YES | YES | YES | PARTIAL | live count 0; AI draft routes reference table |
| `order_items` | YES | YES | YES | YES | YES | PARTIAL | orders API creates items; live order count 0 |
| `order_timeline` | YES | YES | YES | YES | YES | PARTIAL | orders API references timeline; no live events |
| `order_notes` | YES | YES | YES | YES | YES | PARTIAL | order notes route exists; no live order evidence |
| `suppliers` | YES | YES | YES | UNKNOWN | PARTIAL | UNUSED | inventory section exists; supplier workflow not verified |
| `ingredients` | YES | YES | YES | YES | YES | PARTIAL | live count 0; inventory APIs include in-memory paths |
| `stock_movements` | YES | YES | YES | YES | YES | PARTIAL | live count 0; inventory movement evidence not production-ready |
| `consumption_records` | YES | YES | YES | UNKNOWN | UNKNOWN | UNUSED | schema + live table; no clear runtime usage found |
| `loyalty_accounts` | YES | YES | YES | YES | YES | PARTIAL | loyalty APIs include in-memory services; DB flow not verified |
| `loyalty_ledger_entries` | YES | YES | YES | YES | YES | PARTIAL | loyalty code exists; no persisted evidence |
| `rewards` | YES | YES | YES | UNKNOWN | YES | PARTIAL | loyalty section exists; reward CRUD not verified |
| `reward_redemptions` | YES | YES | YES | UNKNOWN | YES | PARTIAL | schema + live table; redemption flow not verified |
| `notification_templates` | YES | YES | YES | YES | YES | PARTIAL | notification APIs exist; live delivery not verified |
| `notifications` | YES | YES | YES | YES | YES | PARTIAL | notification APIs exist; no live sends verified |
| `notification_delivery_logs` | YES | YES | YES | YES | YES | PARTIAL | delivery log table exists; no live events verified |
| `feature_flags` | YES | YES | YES | YES | YES | ACTIVE | live count 6; Control Tower feature flag API |
| `activity_logs` | YES | YES | YES | YES | YES | PARTIAL | live count 0; mutation logging code exists |
| `audit_logs` | YES | YES | YES | YES | YES | PARTIAL | live count 0; audit logging code exists |
| `roles` | YES | YES | YES | YES | PARTIAL | PARTIAL | auth foundation exists; Control Tower role UX not fully verified |
| `user_roles` | YES | YES | YES | YES | PARTIAL | PARTIAL | auth foundation exists; role assignment UX not verified |
| `sessions` | YES | YES | YES | YES | UNKNOWN | PARTIAL | auth/session schema exists; production auth not tested |
| `runtime_configurations` | YES | YES | YES | YES | YES | ACTIVE | live count 3; runtime config Control Tower API |

## Database Reality Conclusion

The schema is ahead of the deployed database. Core catalog tables are active, but runtime access is blocked by `DATABASE_URL` pooler authentication. WhatsApp event persistence and AI media drafts are not production-ready because their required tables are absent from live Supabase.
