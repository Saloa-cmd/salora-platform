# Prisma Migration Execution

Date: 2026-06-01

## Command

```bash
prisma migrate deploy --schema prisma/schema.prisma
```

The command was executed with `DATABASE_URL` and `DIRECT_URL` loaded into the process environment from local untracked env files. No credential values were printed or written to this report.

## Execution Result

Status: `FAILED`

Elapsed time: `6.56s`

## Migration Output Summary

Prisma loaded:

- `prisma.config.ts`
- `prisma/schema.prisma`

Prisma resolved a Supabase PostgreSQL target and then failed with:

```text
Schema engine error
```

No successful migration completion was reported.

## Applied Migrations

Applied migration count during this execution: `0 confirmed`

Because the command failed, no migration is certified as applied by this run.

## Warnings

- The migration endpoint resolved to a Supabase pooler host. Supabase migrations often require a direct connection URL for migration operations.
- Prisma 7 connection URLs are managed through `prisma.config.ts`, not `schema.prisma`.

## Failure Classification

`SUPABASE_DATABASE_AUTHENTICATION_FAILURE`

Follow-up classification confirmed that `DIRECT_URL` now points to a direct Supabase PostgreSQL URL. Prisma migration still failed, and a non-destructive smoke test classified the blocker as authentication failure.

## Required Remediation

1. Confirm the direct connection password is correct.
2. Confirm reserved characters in the password are URL-encoded.
3. Confirm the database user has migration permissions.
3. Re-run `prisma migrate deploy`.
4. Do not run seed or runtime certification until migrations complete successfully.

## Certification Decision

PostgreSQL staging activation status:

`MIGRATIONS_APPLIED`

## Successful Retry

Date: 2026-06-01

After `DIRECT_URL` was corrected to the Supabase direct PostgreSQL host, Prisma migration deployment succeeded.

Execution time: `37.82s`

Applied migrations:

- `202605310001_auth_foundation`
- `202605310002_core_business_domains`
- `202605310003_runtime_persistence`
- `202605310004_revenue_platform`
- `202606010001_runtime_configuration`

Result: `PASS`
