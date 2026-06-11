# SALORA Database Security Inventory

Date: 2026-06-08

Scope: Prisma-managed public schema tables in `prisma/schema.prisma`.

Supabase Security Advisor input: 57+ issues reported, primarily `RLS Disabled in Public`.

No SQL was applied. No table was dropped. No column was removed.

## Inventory

| Table | Purpose | PII | Orders | Auth | Admin Data | Public Content | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `users` | Platform identities and password hashes | YES | NO | YES | YES | NO | CRITICAL |
| `roles` | RBAC role definitions | NO | NO | YES | YES | NO | HIGH |
| `user_roles` | Role assignment bridge | YES | NO | YES | YES | NO | CRITICAL |
| `sessions` | Refresh session persistence | YES | NO | YES | YES | NO | CRITICAL |
| `customer_profiles` | Customer identity profile | YES | YES | NO | NO | NO | CRITICAL |
| `customer_addresses` | Delivery/customer addresses | YES | YES | NO | NO | NO | CRITICAL |
| `customer_preferences` | Customer personalization preferences | YES | NO | NO | NO | NO | HIGH |
| `product_categories` | Menu category taxonomy | NO | NO | NO | YES | YES | MEDIUM |
| `catalog_products` | Product catalog and AI descriptors | NO | NO | NO | YES | YES | MEDIUM |
| `product_images` | Product media references | NO | NO | NO | YES | YES | MEDIUM |
| `product_media_drafts` | Draft media workflow and prompts | MAYBE | NO | NO | YES | NO | HIGH |
| `product_variants` | Product variant options | NO | NO | NO | YES | YES | MEDIUM |
| `product_addons` | Product add-on pricing | NO | NO | NO | YES | YES | MEDIUM |
| `product_modifiers` | Product modifier options | NO | NO | NO | YES | YES | MEDIUM |
| `pricing_rules` | Product pricing rules | NO | NO | NO | YES | NO | HIGH |
| `coupons` | Discount/coupon configuration | NO | YES | NO | YES | PARTIAL | HIGH |
| `coupon_redemptions` | Coupon redemption ledger | YES | YES | NO | YES | NO | HIGH |
| `promotions` | Promotion configuration | NO | NO | NO | YES | PARTIAL | HIGH |
| `promotion_products` | Promotion-product linkage | NO | NO | NO | YES | PARTIAL | MEDIUM |
| `availability_rules` | Product availability windows | NO | NO | NO | YES | PARTIAL | MEDIUM |
| `customer_favorites` | Customer saved/favorite products | YES | NO | NO | NO | NO | HIGH |
| `saved_orders` | Customer saved order templates | YES | YES | NO | NO | NO | HIGH |
| `cafe_orders` | COD/order lifecycle | YES | YES | NO | YES | NO | CRITICAL |
| `order_items` | Order line items | MAYBE | YES | NO | YES | NO | HIGH |
| `order_timeline` | Order state history | MAYBE | YES | NO | YES | NO | HIGH |
| `order_notes` | Staff/customer order notes | YES | YES | NO | YES | NO | HIGH |
| `payments` | Payment status and provider references | YES | YES | NO | YES | NO | CRITICAL |
| `payment_intents` | Payment intent state and client secret references | YES | YES | NO | YES | NO | CRITICAL |
| `refunds` | Refund state | YES | YES | NO | YES | NO | CRITICAL |
| `payment_events` | Provider event payload ledger | MAYBE | YES | NO | YES | NO | CRITICAL |
| `payment_method_references` | Payment method references and card metadata | YES | YES | NO | YES | NO | CRITICAL |
| `payment_audit_logs` | Payment audit trail | YES | YES | NO | YES | NO | CRITICAL |
| `payment_reconciliation_records` | Settlement/reconciliation | YES | YES | NO | YES | NO | CRITICAL |
| `product_reviews` | Customer reviews | YES | YES | NO | YES | PARTIAL | HIGH |
| `conversations` | Conversation sessions across channels | YES | YES | NO | YES | NO | CRITICAL |
| `conversation_messages` | Redacted messages and provider ids | YES | YES | NO | YES | NO | CRITICAL |
| `channel_sessions` | Provider/channel session metadata | YES | YES | NO | YES | NO | HIGH |
| `provider_messages` | Provider idempotency and processing state | MAYBE | NO | NO | YES | NO | HIGH |
| `whatsapp_webhook_events` | WhatsApp webhook payloads | YES | YES | NO | YES | NO | CRITICAL |
| `ai_evaluation_records` | AI quality/cost/safety telemetry | MAYBE | NO | NO | YES | NO | HIGH |
| `ai_recommendation_records` | AI recommendation history | YES | NO | NO | YES | NO | HIGH |
| `suppliers` | Supplier contact records | YES | NO | NO | YES | NO | HIGH |
| `ingredients` | Inventory ingredient master data | NO | NO | NO | YES | NO | MEDIUM |
| `stock_movements` | Inventory movement ledger | NO | NO | NO | YES | NO | HIGH |
| `consumption_records` | Order/ingredient consumption | MAYBE | YES | NO | YES | NO | HIGH |
| `loyalty_accounts` | Loyalty balances and tiers | YES | NO | NO | YES | NO | HIGH |
| `loyalty_ledger_entries` | Loyalty point ledger | YES | YES | NO | YES | NO | HIGH |
| `rewards` | Reward catalog | NO | NO | NO | YES | PARTIAL | MEDIUM |
| `reward_redemptions` | Reward redemption ledger | YES | YES | NO | YES | NO | HIGH |
| `notification_templates` | Notification template content | NO | NO | NO | YES | NO | MEDIUM |
| `notifications` | Customer notifications and recipients | YES | YES | NO | YES | NO | CRITICAL |
| `notification_delivery_logs` | Notification provider responses | YES | NO | NO | YES | NO | HIGH |
| `feature_flags` | Runtime feature controls | NO | NO | NO | YES | NO | HIGH |
| `activity_logs` | Operational activity trail | YES | YES | NO | YES | NO | HIGH |
| `audit_logs` | Compliance audit trail | YES | YES | NO | YES | NO | CRITICAL |
| `runtime_configurations` | Runtime governance settings | MAYBE | NO | NO | YES | NO | HIGH |

## Primary Exposure Concern

The application currently relies on server-side Prisma access paths. If Supabase `anon` or browser-authenticated clients can query public schema tables directly while RLS is disabled, sensitive tables are exposed beyond the intended server boundary.

## Service Boundaries

| Boundary | Tables |
| --- | --- |
| Auth/RBAC | `users`, `roles`, `user_roles`, `sessions` |
| Public catalog | `product_categories`, `catalog_products`, `product_images`, `product_variants`, `product_addons`, `product_modifiers`, `availability_rules`, approved `promotions` |
| Orders/COD | `cafe_orders`, `order_items`, `order_timeline`, `order_notes`, `coupon_redemptions`, payment tables |
| Customer | profiles, addresses, preferences, favorites, saved orders, loyalty, notifications |
| Control Tower | catalog admin, orders, media, runtime config, flags, promotions, coupons, logs |
| Omnichannel/AI | conversations, WhatsApp events, provider messages, AI records |

## Evidence

- Prisma schema maps all listed tables into public schema with `@@map`.
- Runtime code uses Prisma from server routes and Control Tower APIs.
- Supabase Advisor reported RLS disabled in public.
