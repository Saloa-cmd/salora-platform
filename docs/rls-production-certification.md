# SALORA RLS Production Certification v3.0

Date: 2026-06-08

Scope:

- `docs/generated-rls-policies.sql`
- `prisma/migrations/20260608_security_hardening/migration.sql`
- `prisma/migrations/20260608_security_hardening/rollback_strategy.sql`
- `docs/database-security-certification.md`
- Live read-only RLS catalog inspection

No SQL was applied. No RLS was enabled. No production data was modified.

## Decision

RLS_REQUIRES_REMEDIATION

## Executive Finding

RLS is not ready for staging. Live inspection found 56 application tables in `public`, with `rls_enabled=0` and `policies=0`. The generated policy package is additive and mostly aligned with SALORA's intended access model, but it has unresolved correctness and compatibility risks that must be remediated before a staging RLS migration is approved.

## Live Evidence

| Check | Result |
| --- | ---: |
| Inspected public application tables | 56 |
| Tables with RLS enabled | 0 |
| Active PostgreSQL policies | 0 |
| Products | 96 |
| Active products | 96 |
| Product images | 0 |
| Product media drafts | 12 |

## Policy Validation Summary

| Domain | Tables | Policy Result | Reason |
| --- | --- | --- | --- |
| Identity/Auth | `users`, `roles`, `user_roles`, `sessions` | Unsafe until remediated | Policies depend on Supabase `auth.uid()`/`auth.jwt()` while SALORA uses app-issued JWTs and Prisma auth repositories. |
| Customer PII | `customer_profiles`, `customer_addresses`, `customer_preferences` | Unsafe until remediated | Owner policies require verified mapping between SALORA user IDs and Supabase auth UID. |
| Public catalog | `product_categories`, `catalog_products`, `product_images`, variants/addons/modifiers, availability | Mostly safe in intent | Public read is constrained to active/non-archived data, but staging proof is missing. |
| Media drafts | `product_media_drafts` | Safe intent, staging required | Staff read and manager write model is appropriate; publish path depends on app/API authorization. |
| Orders/COD | `cafe_orders`, `order_items`, `order_notes`, `order_timeline` | Unsafe until remediated | Owner/staff checks must be tested with real SALORA session claims before launch. |
| Payments | payment tables | Safe intent, service-role proof required | Service-only posture is correct, but Prisma/server role behavior after RLS is not certified. |
| WhatsApp/Channels | `whatsapp_webhook_events`, `provider_messages`, `channel_sessions`, conversations/messages | Mixed | Webhook event/provider/channel service-only is appropriate; conversation owner/staff policies need auth mapping proof. |
| AI | `ai_evaluation_records`, `ai_recommendation_records` | Mixed | Manager/service access is appropriate; customer recommendation ownership needs auth mapping proof. |
| Operations | suppliers, ingredients, stock, consumption | Safe intent, staging required | Staff/manager boundaries are reasonable but untested. |
| Loyalty/Notifications | loyalty, rewards, notifications | Mixed | Public rewards read is acceptable; owner policies need auth mapping proof. |
| Governance | `feature_flags`, `activity_logs`, `audit_logs`, `runtime_configurations` | Safe intent, staging required | Admin/manager/service boundaries are appropriate; must be tested against app auth. |
| Prisma migrations | `_prisma_migrations` | MUST NOT receive app RLS | It is migration-engine metadata and should remain outside app-facing policy generation. |

## Policy Defects Requiring Remediation

| Defect | Severity | Evidence | Required Fix |
| --- | --- | --- | --- |
| JWT role extraction fallback can fail | High | `salora_jwt_roles()` uses `coalesce(array(select ...), case ...)`; an empty array is not null. | Treat empty roles array as absent before falling back to `app_metadata.role`. |
| App auth/Supabase auth mismatch | Critical | SALORA signs app JWTs in `apps/web/lib/server/auth/service.ts`; policies depend on `auth.uid()` and `auth.jwt()`. | Define claim mapping or restrict direct Supabase access to service/server paths. |
| Policy creation is not idempotent | Medium | SQL uses `create policy`, not conflict-safe deployment logic. | Add preflight or idempotent policy replacement for staging. |
| Service role compatibility not proven | High | Prisma runtime uses PostgreSQL connection through adapter; no post-RLS staging proof exists. | Test Prisma read/write paths under the exact database role used in staging. |
| Live database remains unprotected by RLS | Critical | `rls_enabled=0`, `policies=0`. | Apply approved migration only after backup, review, and staging authorization. |

## Must Receive RLS Before Launch

All application tables containing identity, PII, staff/admin data, orders, payments, audit logs, runtime configuration, provider events, media drafts, loyalty, notifications, AI records, and writeable catalog/commercial data must receive RLS before commercial launch.

Priority tables:

- `users`
- `user_roles`
- `roles`
- `sessions`
- `customer_profiles`
- `customer_addresses`
- `customer_preferences`
- `cafe_orders`
- `order_items`
- `order_notes`
- `order_timeline`
- `activity_logs`
- `audit_logs`
- `product_media_drafts`
- `whatsapp_webhook_events`
- `product_images`
- `catalog_products`
- `promotions`
- `coupons`
- `notifications`
- payment tables
- `runtime_configurations`
- `feature_flags`

## Must Not Receive App RLS

| Table | Reason |
| --- | --- |
| `_prisma_migrations` | Migration engine metadata; app policies must not govern Prisma migration history. |

## Compatibility Certification

| Surface | Certification | Reason |
| --- | --- | --- |
| Control Tower | Not certified | API/page guards exist, but RLS claims and Prisma role behavior are untested after policy application. |
| Website | Not certified | Public catalog policy intent is acceptable, but no staged RLS proof exists. |
| Mobile | Not certified | Mobile is partially API-backed; direct Supabase claims are not established. |
| Prisma | Not certified | `prisma generate` and `migrate status` are currently blocked; post-RLS Prisma role behavior is unproven. |
| Service role | Not certified | Service-role policies exist for some tables, but server role/bypass behavior must be tested. |

## Required Remediation Plan

1. Fix JWT role helper logic.
2. Decide whether SALORA clients will ever use direct Supabase Auth/RLS. If not, state server-only Prisma authority clearly.
3. Add staging preflight for policy-name conflicts.
4. Confirm exact database role used by Prisma runtime and migrations.
5. Stage-test read/write paths for website, mobile, Control Tower, orders, media, WhatsApp, OpenAI, and runtime config after RLS.

