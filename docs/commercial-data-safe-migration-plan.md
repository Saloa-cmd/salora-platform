# Commercial Data Safe Migration Plan

Date: 2026-06-02

## Rule

Do not run `pnpm prisma migrate deploy` until this plan is approved.

## Safe Migration Generation

Recommended review-only command:

```powershell
.\apps\web\node_modules\.bin\prisma.CMD migrate diff --from-schema-datasource prisma\schema.prisma --to-schema-datamodel prisma\schema.prisma --script
```

For real review against Supabase staging, use a shadow-safe workflow only after backup confirmation:

1. Confirm `DATABASE_URL` and `DIRECT_URL` are present without printing values.
2. Confirm Supabase backup exists.
3. Generate SQL migration locally.
4. Review SQL for destructive operations.
5. Validate on throwaway or shadow database first.
6. Apply to staging only after approval.

## Expected Migration Shape

Allowed operations:

- `CREATE TYPE` for new enums.
- `CREATE TABLE` for new launch-aligned entities.
- `ALTER TABLE cafe_orders ADD COLUMN discount_total ... DEFAULT 0`.
- `CREATE INDEX`.
- `CREATE UNIQUE INDEX`.
- `ADD FOREIGN KEY`.
- `CREATE VIEW` for analytics views.

Disallowed operations:

- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- destructive `ALTER TYPE`
- data updates that create fake/demo records
- advanced RLS policy changes
- branch/table/reservation/multi-location additions

## Analytics Views To Add In SQL Review

Prisma does not model views directly in the current setup. Add these in reviewed SQL only:

- `analytics_revenue_daily`
- `analytics_product_daily`
- `analytics_customer_lifetime`
- `analytics_ai_daily`

Inventory analytics can continue using existing ingredients and stock movement tables.

## Storage Buckets

Storage buckets should be reviewed separately from the Prisma migration:

- `product-images`

Do not create review-image storage during Simple Launch unless reviews with images become an approved launch requirement.

## Deployment Gate

Status: `DO_NOT_DEPLOY`

Required approval: Principal Database Architect + Launch Manager.
