# SALORA RLS Root Cause Analysis

Date: 2026-06-08

Scope: live Supabase/PostgreSQL catalog, `docs/generated-rls-policies.sql`, `prisma/migrations/20260608_security_hardening/migration.sql`, `rollback_strategy.sql`.

No SQL was executed to change schema. No policy was deployed. No RLS was enabled.

## Decision

RLS_DESIGN_INCOMPLETE

## Root Cause

RLS is disabled because the RLS migration is still only a local review artifact and has not been applied to the live Supabase database.

Evidence:

- Live catalog inspection returned 57 public tables including `_prisma_migrations`.
- Every inspected table has `rls_enabled=false`, `force_rls=false`, `policy_count=0`.
- `prisma migrate status`, when run outside sandbox restrictions, reports one unapplied migration: `20260608_security_hardening`.
- `docs/generated-rls-policies.sql` and `prisma/migrations/20260608_security_hardening/migration.sql` both contain RLS enablement and `create policy` statements, proving policy work exists locally but is not live.

## Tables Requiring RLS

All application tables in `public` require RLS except migration metadata. Priority launch-critical tables:

| Domain | Tables |
| --- | --- |
| Auth/RBAC | `users`, `roles`, `user_roles`, `sessions` |
| Customer PII | `customer_profiles`, `customer_addresses`, `customer_preferences`, `customer_favorites`, `saved_orders` |
| Orders | `cafe_orders`, `order_items`, `order_notes`, `order_timeline` |
| Catalog/media | `catalog_products`, `product_categories`, `product_images`, `product_media_drafts`, `product_variants`, `product_addons`, `product_modifiers`, `availability_rules`, `pricing_rules` |
| Commercial | `promotions`, `promotion_products`, `coupons`, `coupon_redemptions` |
| Payments | `payments`, `payment_intents`, `refunds`, `payment_events`, `payment_method_references`, `payment_audit_logs`, `payment_reconciliation_records` |
| Channels | `whatsapp_webhook_events`, `provider_messages`, `channel_sessions`, `conversations`, `conversation_messages` |
| AI | `ai_evaluation_records`, `ai_recommendation_records` |
| Operations | `suppliers`, `ingredients`, `stock_movements`, `consumption_records` |
| Loyalty/notifications | `loyalty_accounts`, `loyalty_ledger_entries`, `rewards`, `reward_redemptions`, `notifications`, `notification_templates`, `notification_delivery_logs` |
| Governance | `feature_flags`, `activity_logs`, `audit_logs`, `runtime_configurations` |

## Exempt Table

| Table | Reason |
| --- | --- |
| `_prisma_migrations` | Prisma migration metadata. It should not be governed by app-facing RLS policies. |

## Missing Policies

Live database has zero policies. Therefore every application policy is missing in live Supabase.

## Unsafe / Incomplete Policy Design

| Issue | Evidence | Impact | Fix |
| --- | --- | --- | --- |
| JWT role fallback bug | `salora_jwt_roles()` uses `coalesce(array(select ...), case ...)`; empty array is not null. | Single `app_metadata.role` may be ignored. | Rewrite helper to use roles array when non-empty, otherwise fallback to single role. |
| Auth-claim mismatch | SQL policies depend on `auth.uid()` / `auth.jwt()`; SALORA web auth uses app JWT + Prisma repository. | Direct Supabase RLS may not recognize SALORA sessions. | Decide and document either Supabase Auth claim mapping or server-only Prisma authority. |
| Policy deploy idempotence | SQL uses `create policy` without preflight/drop-if-exists. | Re-run can fail on policy-name conflicts. | Add staging preflight or conflict-safe migration strategy. |
| Prisma/service role behavior not proven | RLS would affect queries depending on DB role. | App can break after RLS. | Test exact runtime DB role against staged RLS before production. |

## Exact Remediation Steps

1. Fix `salora_jwt_roles()` role extraction.
2. Add a policy-name preflight query to the staging runbook.
3. Decide auth model: Supabase Auth/RLS claims or server-only Prisma access with service role.
4. Confirm Prisma runtime database role and migration database role.
5. Take Supabase backup.
6. Apply `20260608_security_hardening` only in staging after approval.
7. Verify `pg_class.relrowsecurity=true` and non-zero policies for target tables.
8. Run website, mobile, Control Tower, auth, media, orders, WhatsApp, and OpenAI smoke tests against staged RLS.

