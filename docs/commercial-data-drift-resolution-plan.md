# Commercial Data Drift Resolution Plan

Date: 2026-06-03

## Current Drift

Prisma schema has advanced beyond the checked-in migration history. The schema now includes commercial data models for product images, coupons, promotions, reviews, AI recommendation records, feature flags, activity logs, and audit logs. Supabase staging is assumed to remain at the prior migration state through `202606010001_runtime_configuration`.

The generated migration also exposes existing drift between prior hand-authored SQL migrations and the current Prisma schema:

- Existing migrations use database defaults such as `gen_random_uuid()` and `now()`.
- Current Prisma schema uses Prisma-side defaults such as `uuid()` and `@updatedAt`, which Prisma translates into dropping some database defaults during diff generation.
- Existing foreign key definitions differ from Prisma's generated constraint shape, especially around `ON UPDATE CASCADE`.
- Some indexes present in the Prisma schema are not present in earlier SQL migrations, causing unrelated index additions.

## How The Generated Migration Resolves Drift

The generated SQL would create the intended commercial data tables and enums. It would also attempt to normalize older SQL-first schema details to Prisma's current interpretation by:

- Dropping/recreating many existing foreign keys.
- Dropping database defaults from existing IDs and timestamps.
- Adding indexes to existing non-commercial tables.

That broader normalization is not acceptable for this scope.

## Remaining Drift After Applying As Generated

If applied as generated, the commercial schema drift would be mostly closed, but at the cost of introducing risky runtime drift:

- Existing direct SQL inserts could lose database-generated IDs.
- Existing direct SQL inserts could lose database-generated timestamp behavior.
- Broad foreign key churn could lock core tables and change operational risk without business value.
- Staging would contain unrelated changes that are hard to attribute to commercial data alignment.

## Resolution Plan

1. Regenerate from a Prisma baseline that accurately represents the existing deployed database defaults and constraints, or manually curate the generated SQL.
2. Keep only approved additive commercial objects and their required foreign keys.
3. Decide separately whether `cafe_orders.discount_total` is part of the approved coupon/order contract. If approved, keep it as `NOT NULL DEFAULT 0`; otherwise remove it from this migration.
4. Move any Prisma normalization of historical defaults, foreign keys, and indexes into a separate database-foundation drift remediation review.
5. Re-run `prisma validate`, inspect generated SQL again, and only then consider manual staging deployment review.

## Status

Drift resolution status: partial but unsafe. The generated migration resolves commercial model absence but introduces unrelated existing-table drift changes.
