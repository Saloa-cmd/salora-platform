# Commercial Data Existing Table Impact

Date: 2026-06-03

Migration reviewed: `prisma/migrations/202606030001_commercial_data_alignment/migration.sql`

## Summary

The generated migration modifies existing tables beyond the allowed commercial models. The intended new commercial tables are acceptable in isolation, but the generated SQL also performs broad existing-table foreign key churn, default removal, and index creation.

## Existing Table Impact

| Table | Change type | Nullable/default safety | Lock risk | Compatibility risk |
| --- | --- | --- | --- | --- |
| `cafe_orders` | Adds `discount_total`; drops/readds FK; drops defaults from `id` and `updated_at` | `discount_total` is non-null with default `0`, generally backfill-safe. Dropping `id`/`updated_at` defaults is unsafe for direct inserts. | Medium to high because `ALTER TABLE`, FK validation, and default changes lock the table. | High due default removal and FK churn. |
| `users`, `roles`, `sessions`, `user_roles` | Drops/readds FKs; drops ID/default behavior on several tables | Default removal can break inserts outside Prisma. | Medium. | High. Auth tables are outside approved scope. |
| `customer_profiles`, `customer_addresses`, `customer_preferences`, `customer_favorites` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe; indexes may be useful but are unrelated. | Medium. | High because customer tables are outside approved migration scope except as FK targets. |
| `catalog_products`, `product_categories`, `product_variants`, `product_addons`, `product_modifiers`, `pricing_rules`, `availability_rules`, `saved_orders` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe for product maintenance workflows. | Medium. | High because the generated migration changes existing catalog behavior beyond relation targets. |
| `order_items`, `order_timeline`, `order_notes` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe. | Medium. | Medium to high for order-write compatibility. |
| `suppliers`, `ingredients`, `stock_movements`, `consumption_records` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe. | Medium. | High because inventory tables are outside approved scope. |
| `loyalty_accounts`, `loyalty_ledger_entries`, `rewards`, `reward_redemptions` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe. | Medium. | High because loyalty tables are outside approved scope. |
| `notifications`, `notification_templates`, `notification_delivery_logs` | Drops/readds FKs; drops ID/default behavior; adds indexes | Default removal is unsafe. | Medium. | High because notifications are outside approved scope. |
| `conversations`, `conversation_messages`, `channel_sessions`, `provider_messages`, `ai_evaluation_records` | Drops ID/default behavior and some `updated_at` defaults | Default removal is unsafe. | Low to medium. | High because runtime persistence tables are outside approved scope. |
| `payments`, `payment_intents`, `refunds`, `payment_events`, `payment_method_references`, `payment_audit_logs`, `payment_reconciliation_records` | Drops ID/default behavior and some `updated_at` defaults | Default removal is unsafe. | Low to medium. | High because revenue platform tables are outside approved scope. |
| `runtime_configurations` | Drops ID default | Default removal is unsafe. | Low. | Medium to high for runtime configuration writes. |

## Conclusion

Existing table impact is too broad for Simple Launch commercial data alignment. This migration should not move to deployment review until existing-table changes are reduced to explicitly approved, additive-only changes.
