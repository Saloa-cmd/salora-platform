# SALORA COD Order Lifecycle Certification

Date: 2026-06-05  
Phase: Soft Launch Operational Activation / Phase F

## Final Status

**COD_ACTIVE**

## Runtime Flags

| Flag | Value |
|---|---|
| `PAYMENT_COD_ENABLED` | `true` |
| `PAYMENT_STRIPE_ENABLED` | `false` |
| `PAYMENT_PROVIDER` | `mock` |
| `STRIPE_ENABLED` | `false` |

## Schema Alignment

COD smoke initially exposed schema drift:
- Prisma model expected `cafe_orders.discount_total`.
- Live Supabase lacked the column.

Resolution:
- Applied additive migration `202606050001_cod_order_discount_total_alignment`.
- `prisma migrate status` now reports database schema up to date.

## Lifecycle Test

Rollback-only COD smoke order:

| Check | Result |
|---|---|
| order stored in database | PASS_ROLLBACK |
| payment method | `COD` |
| payment state | `UNPAID` |
| order items stored | 1 item |
| initial status | `PENDING_CONFIRMATION` |
| transition to `PREPARING` | PASS_ROLLBACK |
| transition to `READY` | PASS_ROLLBACK |
| transition to `DELIVERED` | PASS_ROLLBACK |
| invalid transitions rejected by policy | PASS |
| ActivityLog created | PASS_ROLLBACK |
| AuditLog created | PASS_ROLLBACK |
| Stripe intent created | NO; payment intent count 0 |
| transaction rollback | PASS |

## Evidence Constraint

No persistent fake order was left in Supabase. The COD test used a transaction and rolled back.
