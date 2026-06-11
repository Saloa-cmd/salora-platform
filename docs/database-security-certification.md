# SALORA Database Security Certification

Date: 2026-06-08

Scope: `prisma/schema.prisma`, `docs/generated-rls-policies.sql`, `prisma/migrations/20260608_security_hardening/migration.sql`, `prisma/migrations/20260608_security_hardening/rollback_strategy.sql`, `docs/database-security-inventory.md`, `docs/database-access-matrix.md`, `docs/rls-strategy-report.md`, read-only live catalog checks.

No SQL was applied. No migration was executed. No production data was modified.

## Decision

REQUIRES_POLICY_CHANGES

The policy set is directionally correct and non-destructive, but it cannot be certified safe for staging yet because live Supabase RLS is disabled on all inspected `public` application tables and the generated policies still have JWT-claim and migration-safety risks.

## Live Evidence

Read-only Prisma/SQL inspection showed:

| Metric | Value |
| --- | ---: |
| Products | 96 |
| Active products | 96 |
| Categories | 15 |
| Users | 1 |
| Sessions | 0 |
| Orders | 0 |
| Product images | 0 |
| Product media drafts | 12 |
| WhatsApp webhook events | 0 |
| Activity logs | 1 |
| Audit logs | 1 |
| Promotions | 2 |
| Coupons | 2 |

Live RLS catalog inspection found `rls_enabled=false`, `force_rls=false`, and `policies=0` for every inspected SALORA `public` table.

## Policy SQL Review

Evidence sources:

- `docs/generated-rls-policies.sql`
- `prisma/migrations/20260608_security_hardening/migration.sql`
- `prisma/migrations/20260608_security_hardening/rollback_strategy.sql`

Findings:

| Area | Finding | Risk |
| --- | --- | --- |
| Destructive SQL | Search found no `drop table`, `drop column`, `truncate`, `delete from`, or `alter table ... drop` statements in generated policy SQL or draft migration. | Low |
| RLS activation | SQL contains `alter table ... enable row level security` for core application tables. | Expected |
| Policy creation | SQL uses `create policy`, not idempotent `drop policy if exists` plus `create policy`, so reruns will fail if policies already exist. | Medium |
| JWT role extraction | `salora_jwt_roles()` uses `coalesce(array(select ...), case ...)`; `array(select ...)` returns an empty array, not null, so fallback single `app_metadata.role` may not be used. | High |
| Auth model alignment | Policies depend on `auth.uid()` and `auth.jwt()` Supabase claims, while SALORA web auth uses app-issued tokens and Prisma repositories. Direct Supabase clients may not carry matching claims. | High |
| Service role | Some service-only policies exist, but Prisma server access must be confirmed to use the expected server-side database authority after RLS. | High |
| Public catalog | Public reads are restricted to active catalog products, active categories, approved reviews, active coupons/promotions, and non-archived product images. | Positive |
| Sensitive domains | Orders, payments, sessions, user roles, audit logs, activity logs, AI records, WhatsApp events, notifications, and runtime configuration are not public in the generated strategy. | Positive |

## Table-by-Table Certification

| Table | Public | Customer | Staff | Manager | Admin | Service Role | Class | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| users | No | Self | No | No | Yes | Yes | MUST HAVE RLS | Needs policy claim fix |
| roles | No | No | Read | Read | Write | Yes | MUST HAVE RLS | Needs staging proof |
| user_roles | No | No | No | No | Yes | Yes | MUST HAVE RLS | Needs staging proof |
| sessions | No | Self | No | No | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| customer_profiles | No | Self | Read | Write | Write | Yes | MUST HAVE RLS | Needs auth alignment proof |
| customer_addresses | No | Self | Read | Limited | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| customer_preferences | No | Self | No | Limited | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| product_categories | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| catalog_products | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| product_images | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| product_media_drafts | No | No | Read | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| product_variants | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| product_addons | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| product_modifiers | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| pricing_rules | No | No | Read | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| coupons | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| coupon_redemptions | No | Self | Read | Write | Write | Yes | MUST HAVE RLS | Needs auth alignment proof |
| promotions | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| promotion_products | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| availability_rules | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| customer_favorites | No | Self | No | No | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| saved_orders | No | Self | No | No | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| cafe_orders | No | Self | Read/Update | Read/Update | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| order_items | No | Self read | Read | Write | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| order_timeline | No | Self read | Read/Write | Write | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| order_notes | No | Self public notes | Read/Write | Write | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| payments | No | No direct | No direct | No direct | Read audit only | Yes | SERVICE ROLE ONLY | Needs Prisma service-role proof |
| payment_intents | No | No direct | No direct | No direct | No direct | Yes | SERVICE ROLE ONLY | Needs Prisma service-role proof |
| refunds | No | No | No | Read | Read | Yes | SERVICE ROLE ONLY | Needs Prisma service-role proof |
| payment_events | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs Prisma service-role proof |
| payment_method_references | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs Prisma service-role proof |
| payment_audit_logs | No | No | No | No | Read | Yes | MUST HAVE RLS | Needs staging proof |
| payment_reconciliation_records | No | No | No | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| product_reviews | Approved read | Own/write limited | Write | Write | Write | Yes | SHOULD HAVE RLS | Needs auth alignment proof |
| conversations | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| conversation_messages | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| channel_sessions | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs staging proof |
| provider_messages | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs staging proof |
| whatsapp_webhook_events | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs staging proof |
| ai_evaluation_records | No | No | No | Read/Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| ai_recommendation_records | No | Self read | No | Read | Write | Yes | MUST HAVE RLS | Needs auth alignment proof |
| suppliers | No | No | No | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| ingredients | No | No | Read | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| stock_movements | No | No | Read | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| consumption_records | No | No | Read/Write | Read/Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| loyalty_accounts | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| loyalty_ledger_entries | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| rewards | Active read | No | Read | Write | Write | Yes | SHOULD HAVE RLS | Needs staging proof |
| reward_redemptions | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| notification_templates | No | No | Read | Write | Write | Yes | MUST HAVE RLS | Needs staging proof |
| notifications | No | Self | Read | Read | Yes | Yes | MUST HAVE RLS | Needs auth alignment proof |
| notification_delivery_logs | No | No | No | No | No | Yes | SERVICE ROLE ONLY | Needs staging proof |
| feature_flags | No | No | No | No | Write | Yes | MUST HAVE RLS | Needs staging proof |
| activity_logs | No | No | No | Read | Read | Yes | MUST HAVE RLS | Needs staging proof |
| audit_logs | No | No | No | No | Read | Yes | MUST HAVE RLS | Needs staging proof |
| runtime_configurations | No | No | No | No | Write | Yes | MUST HAVE RLS | Needs staging proof |
| _prisma_migrations | No | No | No | No | No | Migration engine only | MUST NOT HAVE APP RLS | Exclude from app policies |

## Required Policy Changes

1. Fix `salora_jwt_roles()` so single-role JWT claims work when the roles array is absent or empty.
2. Define and document how SALORA app JWT roles map into Supabase JWT claims before relying on `auth.jwt()` policies for direct Supabase access.
3. Add idempotent policy deployment behavior or enforce one-time migration execution with a clean preflight that confirms no conflicting policy names exist.
4. Confirm Prisma server operations use a connection role that will not be broken by RLS, or create explicit service-role-compatible policies for server-side writes.
5. Stage-test owner policies for `users`, `sessions`, `customer_profiles`, orders, loyalty, notifications, and AI recommendation records.

