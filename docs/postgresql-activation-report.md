# PostgreSQL Activation Report

Date: 2026-06-01

## Status

Local certification: schema and migration artifacts prepared.

Staging activation: complete for Supabase PostgreSQL migration, schema verification, Prisma generation, and safe seed.

## Prepared Migrations

- Existing migrations `202605310001` through `202605310004`.
- New migration `202606010001_runtime_configuration`.

## Validation Scope

Required for staging:

- `pnpm prisma migrate deploy`
- `pnpm prisma generate`
- schema validation
- backup validation
- restore validation
- rollback validation

## Activation Result

Executed against Supabase staging using `DIRECT_URL` for migrations.

Status: `ACTIVE`.

## Supabase Compatibility Update

Prisma 7 connection governance:

- `DATABASE_URL` remains the pooled runtime connection.
- `DIRECT_URL` is the direct Supabase PostgreSQL connection used by Prisma CLI migrations through `prisma.config.ts`.

`.env.example` remains placeholder-only and contains no real credentials.

## Enterprise Gate

PostgreSQL is certified for staging runtime operations. Production traffic still requires backup, restore, rollback, and controlled launch drills.

## Latest Execution Result

Migration command succeeded against Supabase staging.

Applied migrations:

- `202605310001_auth_foundation`
- `202605310002_core_business_domains`
- `202605310003_runtime_persistence`
- `202605310004_revenue_platform`
- `202606010001_runtime_configuration`

Prisma Client generation: `PASS`

Table verification: `PASS`

Staging seed: `PASS`

Backup/restore drill: `PROCEDURE_READY_LIVE_DRILL_PENDING`
