# Staging Migration Plan

Date: 2026-06-01

## Migration List

Apply in this order:

1. `202605310001_auth_foundation`
2. `202605310002_core_business_domains`
3. `202605310003_runtime_persistence`
4. `202605310004_revenue_platform`
5. `202606010001_runtime_configuration`

## Expected Tables

- `users`
- `roles`
- `user_roles`
- `sessions`
- `customer_profiles`
- `customer_addresses`
- `customer_preferences`
- `product_categories`
- `catalog_products`
- `product_variants`
- `product_addons`
- `product_modifiers`
- `pricing_rules`
- `availability_rules`
- `cafe_orders`
- `order_items`
- `order_timeline`
- `order_notes`
- `suppliers`
- `ingredients`
- `stock_movements`
- `consumption_records`
- `loyalty_accounts`
- `loyalty_ledger_entries`
- `rewards`
- `reward_redemptions`
- `notification_templates`
- `notifications`
- `notification_delivery_logs`
- `conversations`
- `conversation_messages`
- `channel_sessions`
- `provider_messages`
- `payments`
- `payment_intents`
- `refunds`
- `payment_events`
- `payment_method_references`
- `payment_audit_logs`
- `payment_reconciliation_records`
- `ai_evaluation_records`
- `runtime_configurations`

## Destructive-Change Review

Current migration set creates schema objects and indexes. No migration in the inspected set intentionally drops application tables.

## Backup Requirement Before Migration

Before `pnpm prisma migrate deploy` against Supabase staging:

- Confirm Supabase project backup is enabled.
- Capture a manual backup or verify recent restore point.
- Record migration baseline.
- Confirm restore permissions.

## Rollback Consideration

Prisma migrations should be treated as forward-only during normal operation. If staging migration corrupts schema or data, rollback should use Supabase restore to the pre-migration backup, followed by code rollback if needed.

## Current Execution Status

Migration execution is blocked because `DATABASE_URL` and `DIRECT_URL` are not available in the current environment.
