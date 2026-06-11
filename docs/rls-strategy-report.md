# SALORA RLS Strategy Report

Date: 2026-06-08

## Strategy

Enable RLS on every application table in public schema, but do not force RLS on table owners. This protects direct Supabase `anon` and `authenticated` access while preserving server-side Prisma runtime access where the database owner/service credential is used.

Do not execute this strategy until a human operator confirms:

1. Current Supabase backup exists.
2. Deployment credentials use owner/service credentials for Prisma server runtime.
3. Supabase client-side direct table access is not required for SALORA mobile/web.
4. Generated SQL has been reviewed in a staging database.

## Helper Claims Model

Policies assume Supabase JWTs can include either:

- `app_metadata.roles`: array of role strings, or
- `app_metadata.role`: single role string.

Because SALORA uses application JWT auth today, direct Supabase customer owner policies are protective placeholders. Server Prisma remains the business authority until SALORA maps app users to Supabase auth identities.

## Table Decisions

| Table | Enable RLS | Reason |
| --- | --- | --- |
| `users` | YES | Password hashes and RBAC identity data. |
| `roles` | YES | Role definitions are low sensitivity but must not be mutable by public users. |
| `user_roles` | YES | Critical privilege assignment data. |
| `sessions` | YES | Refresh token hashes and session metadata. |
| `customer_profiles` | YES | PII and customer identity. |
| `customer_addresses` | YES | High-sensitivity address data. |
| `customer_preferences` | YES | Customer personalization data. |
| `product_categories` | YES | Public active read can be allowed; writes restricted. |
| `catalog_products` | YES | Active products can be public; draft/admin metadata must be protected. |
| `product_images` | YES | Public read only for non-deleted active product images. |
| `product_media_drafts` | YES | Draft prompts/media workflow must be staff/manager only. |
| `product_variants` | YES | Public read only through active products. |
| `product_addons` | YES | Public read only through active products. |
| `product_modifiers` | YES | Public read only through active products. |
| `pricing_rules` | YES | Pricing controls should not be public direct-read. |
| `coupons` | YES | Public active metadata only; admin writes restricted. |
| `coupon_redemptions` | YES | Order/customer-linked ledger. |
| `promotions` | YES | Public active approved metadata only. |
| `promotion_products` | YES | Public only when linked promotion/product is active. |
| `availability_rules` | YES | Public only through active products. |
| `customer_favorites` | YES | Owner-only customer behavior. |
| `saved_orders` | YES | Owner-only order preferences. |
| `cafe_orders` | YES | Critical order and customer PII. |
| `order_items` | YES | Order content linked to customer/order. |
| `order_timeline` | YES | Order operational trail. |
| `order_notes` | YES | May contain customer/staff sensitive data. |
| `payments` | YES | Payment state and provider references. |
| `payment_intents` | YES | Client secret references and provider ids. |
| `refunds` | YES | Payment operations. |
| `payment_events` | YES | Provider payloads and event references. |
| `payment_method_references` | YES | Card metadata and payment references. |
| `payment_audit_logs` | YES | Compliance logs. |
| `payment_reconciliation_records` | YES | Settlement data. |
| `product_reviews` | YES | Public only when approved; owner/staff otherwise. |
| `conversations` | YES | Channel/customer PII. |
| `conversation_messages` | YES | Redacted message content still sensitive. |
| `channel_sessions` | YES | Provider session metadata. |
| `provider_messages` | YES | Provider idempotency and processing. |
| `whatsapp_webhook_events` | YES | Webhook payloads may contain PII. |
| `ai_evaluation_records` | YES | AI operational telemetry. |
| `ai_recommendation_records` | YES | Customer-linked recommendations. |
| `suppliers` | YES | Supplier contact data. |
| `ingredients` | YES | Internal inventory. |
| `stock_movements` | YES | Inventory ledger. |
| `consumption_records` | YES | Operational/order-linked inventory. |
| `loyalty_accounts` | YES | Customer account balances. |
| `loyalty_ledger_entries` | YES | Loyalty ledger. |
| `rewards` | YES | Active rewards may be public; writes restricted. |
| `reward_redemptions` | YES | Customer redemption ledger. |
| `notification_templates` | YES | Internal messaging templates. |
| `notifications` | YES | Recipients and payloads. |
| `notification_delivery_logs` | YES | Provider responses. |
| `feature_flags` | YES | Runtime controls. |
| `activity_logs` | YES | Operational activity trail. |
| `audit_logs` | YES | Compliance trail. |
| `runtime_configurations` | YES | Runtime governance controls. |

## Prisma Compatibility Position

RLS should not be forced for table owners in the initial migration. If Prisma uses the Supabase `postgres` owner or service-role equivalent, existing server APIs continue to work while direct public access is constrained.

If Prisma is moved to a non-owner `authenticated` role in the future, application service JWT claims or database roles must be introduced before enabling `FORCE ROW LEVEL SECURITY`.
