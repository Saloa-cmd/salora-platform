# Commercial Data Drift Analysis

Date: 2026-06-02

## Current State

Prisma schema has been extended for Commercial Data Alignment, but no database migration has been generated or deployed.

Therefore, intentional drift now exists between:

- `prisma/schema.prisma`
- Supabase staging database

This is expected at the review stage.

## Drift Categories

| Category | Drift |
|---|---|
| Prisma enums | New enums exist in Prisma but not yet in database. |
| Prisma models | New models exist in Prisma but not yet in database. |
| Existing order table | `CafeOrder.discountTotal` exists in Prisma but not yet in database. |
| Analytics views | Planned in docs, not represented in Prisma schema. |
| Storage buckets | Planned separately, not represented in Prisma schema. |

## Not Drift

These were intentionally excluded and should not appear in Prisma or database migration:

- Branches
- Cafe Tables
- Reservations
- Multi-location support
- Advanced RLS policies

## Required Drift Resolution

Before any deployment:

1. Generate migration SQL from Prisma.
2. Review SQL manually.
3. Confirm no destructive operations.
4. Add analytics views as a separate reviewed SQL migration if approved.
5. Apply to staging only after explicit approval.
6. Run `prisma generate` after migration approval.

## Status

`DRIFT_EXPECTED_REVIEW_STAGE`

No action has been applied to Supabase.
