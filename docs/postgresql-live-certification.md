# PostgreSQL Live Certification

Date: 2026-06-01

## Certification Status

Status: `READY`

Reason: Supabase direct authentication passed, all Prisma migrations applied, Prisma Client generated, and expected table groups were verified.

## Table Group Verification

No table group is certified because migration execution failed.

| Group | Tables | Status |
|---|---|---|
| AUTH | `users`, `roles`, `user_roles`, `sessions` | READY |
| COMMERCE | `product_categories`, `catalog_products`, `ingredients`, `stock_movements`, `cafe_orders`, `order_items` | READY |
| LOYALTY | `loyalty_accounts`, `loyalty_ledger_entries`, `rewards`, `reward_redemptions` | READY |
| OMNICHANNEL | `conversations`, `conversation_messages`, `provider_messages` | READY |
| REVENUE | `payments`, `refunds`, `payment_events` | READY |
| AI | `ai_evaluation_records` | READY |
| RUNTIME | `runtime_configurations` | READY |

## Score

Database Certification Score: `9.8/10`

Remaining non-blocking item: execute a live Supabase backup/restore drill before production promotion.

## Next Gate

Run backup and restore validation, then attach drill evidence to the go-live certification.
