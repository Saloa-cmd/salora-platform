# Commercial Data Backward Compatibility Report

Date: 2026-06-02

## Summary

The Prisma-first Commercial Data Alignment is backward compatible by design. Existing SALORA data remains untouched because the change adds new tables and one safe defaulted column.

## Existing Tables Preserved

No existing table is removed or renamed.

No existing column is removed or renamed.

No existing enum is modified.

## Existing Models Updated

| Model | Change | Compatibility |
|---|---|---|
| `CatalogProduct` | Adds relations only. | Safe; no existing product fields changed. |
| `CustomerProfile` | Adds relations only. | Safe; no existing customer fields changed. |
| `CafeOrder` | Adds `discountTotal` with default `0`. | Safe; existing orders receive zero discount semantics. |

## New Tables

All new tables are additive:

- `product_images`
- `coupons`
- `coupon_redemptions`
- `promotions`
- `promotion_products`
- `product_reviews`
- `ai_recommendation_records`
- `feature_flags`
- `activity_logs`
- `audit_logs`

## Data Safety

- No demo data.
- No fake records.
- No destructive SQL.
- No Supabase deployment.
- No branch/table/reservation/multi-location data structures.

## Application Compatibility

Current application code can continue using existing APIs because no required existing fields changed.

New capabilities are available to Control Tower/API work after reviewed migration and Prisma client generation.

## Remaining Review Items

- Confirm generated SQL uses safe `CREATE TYPE` syntax for the target PostgreSQL version.
- Confirm unique indexes match launch behavior.
- Confirm `discount_total DEFAULT 0` is acceptable for existing orders.
- Confirm analytics views are added as SQL review step, since Prisma schema does not own views.
