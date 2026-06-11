# SALORA Database Runtime Recovery

Date: 2026-06-04  
Scope: `DATABASE_URL`, `DIRECT_URL`, `prisma.config.ts`, `prisma/schema.prisma`, Prisma runtime client.

## Current DATABASE_URL Status

**FAIL**

Evidence:
- Runtime code uses `DATABASE_URL` in `packages/backend/src/database/prisma.ts`.
- `DATABASE_URL` points to Supabase pooler host on port `6543` with `pgbouncer=true`.
- Sanitized URL shape check shows the pooler password segment contains square brackets.
- Read-only Prisma test with current `DATABASE_URL` returned:
  - `P1000`
  - `Authentication failed against database server`

## Current DIRECT_URL Status

**PASS**

Evidence:
- `prisma.config.ts` prefers `process.env.DIRECT_URL || env("DATABASE_URL")`.
- Read-only Prisma `db execute --stdin` with `DIRECT_URL` returned:
  - `Script executed successfully`
- Live `information_schema` queries through `DIRECT_URL` succeeded.

## Prisma Datasource Configuration

Evidence:
- `prisma/schema.prisma` datasource only declares provider:
  - `provider = "postgresql"`
- Runtime Prisma adapter is configured in `packages/backend/src/database/prisma.ts`:
  - `new PrismaPg({ connectionString: env.DATABASE_URL })`
- Migration/config datasource is configured in `prisma.config.ts`:
  - `const migrationUrl = process.env.DIRECT_URL || env("DATABASE_URL")`

Runtime and migration paths are not identical:
- Runtime application path: `DATABASE_URL`.
- Prisma CLI/migration path: `DIRECT_URL` when present.

## Root Cause Analysis

Primary blocking point:
- `DATABASE_URL` credentials are not accepted by the Supabase pooler.

Evidence:
- Current pooler URL returns `P1000`.
- Direct URL succeeds.
- Sanitized shape comparison shows `DATABASE_URL` password has square brackets while `DIRECT_URL` does not.

Secondary unresolved point:
- A temporary bracketless pooler URL changed the failure from `P1000` to `P1017` / timeout behavior in one test, so correcting brackets is necessary but not yet proven sufficient.
- This suggests one or more additional pooler settings still need verification in Supabase:
  - correct pooler password
  - transaction/session pooler mode
  - SSL requirement
  - allowed connection source
  - pooler endpoint/region validity

## Exact Blocking Point

`packages/backend/src/database/prisma.ts` requires a working `DATABASE_URL`. The current value fails before any Control Tower, Website, WhatsApp, or Order database workflow can be certified.

## Recommended Fix

1. In Supabase, copy the official pooler connection string for the target project and environment.
2. Ensure the password matches the database password exactly and is URL-encoded only when required.
3. Remove literal square brackets from the password segment unless they are truly part of the database password.
4. Add `sslmode=require` if Supabase pooler settings require it for the Prisma/pg adapter.
5. Re-test:
   - `DATABASE_URL` read-only `SELECT 1`
   - `connectPrisma()`
   - one Control Tower read endpoint
   - one Control Tower rollback-safe write path
6. Keep `DIRECT_URL` for migrations and administrative schema checks only.

## Risk Assessment

| Risk | Level | Evidence |
|---|---|---|
| Runtime application outage | HIGH | All runtime Prisma calls use `DATABASE_URL` |
| Migration safety | LOW | `DIRECT_URL` works and Prisma schema validates |
| Accidental production mutation | MEDIUM | Runtime validation requires write tests; use transaction rollback or staging-only records |
| Secret exposure | HIGH | `.env` contains real credentials; reports redact values |

## Final Status

**FAIL**

`DIRECT_URL` is operational, but `DATABASE_URL` is still not runtime-ready.
