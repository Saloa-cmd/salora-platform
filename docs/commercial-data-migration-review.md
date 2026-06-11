# Commercial Data Migration Review

Date: 2026-06-03

Migration reviewed: `prisma/migrations/202606030001_commercial_data_alignment/migration.sql`

## Generation Summary

The migration SQL was generated locally with Prisma `migrate diff` from the checked-in migration history to the updated Prisma schema. A local in-memory PGlite shadow database was used for replay. No Supabase connection was used, and nothing was applied to staging.

## Approved Scope Check

In-scope new tables are present:

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

In-scope new enums are present:

- `DiscountType`
- `PromotionStatus`
- `ReviewStatus`
- `AuditAction`

No branches, cafe tables, reservations, multi-location support, advanced RLS policies, or demo data were found.

## Destructive Change Review

Result: NEEDS_FIXES

Findings:

- `DROP TABLE`: No.
- `DROP COLUMN`: No.
- `TRUNCATE`: No.
- `DELETE FROM`: No.
- Demo data: No.
- RLS policy changes: No.
- Destructive `ALTER TYPE`: No.
- Destructive or risky `ALTER COLUMN`: Yes. The generated SQL drops defaults from many existing `id` columns and several `updated_at` columns.
- Existing foreign key churn: Yes. The generated SQL drops and recreates many existing foreign key constraints outside the approved commercial-data scope.

The generated SQL is not safe to deploy as-is because it modifies broad existing schema behavior unrelated to the approved Simple Launch commercial data alignment.

## Required Fixes Before Deployment Review

Regenerate or hand-curate the migration so it contains only:

- New approved enums.
- New approved commercial tables.
- Indexes and foreign keys for those new commercial tables.
- The `cafe_orders.discount_total` column only if explicitly approved as part of coupon redemption/order totals compatibility.

Remove from the migration before review:

- All `ALTER COLUMN ... DROP DEFAULT` statements on existing tables.
- All existing foreign key drop/recreate churn unless a specific constraint change is intentionally approved.
- All unrelated existing-table index additions unless they are proven missing from prior migrations and intentionally included in this migration.
