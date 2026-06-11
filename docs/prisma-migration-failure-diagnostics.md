# Prisma Migration Failure Diagnostics

Date: 2026-06-01

## Current Failure

Previous migration attempt failed with:

```text
Schema engine error
```

## Diagnosis

Initial secret-safe connection classification showed:

- `DATABASE_URL` is a Supabase pooler URL, which is acceptable for runtime.
- `DIRECT_URL` was a Supabase pooler URL, which is not acceptable for Prisma migrations.

Latest remediation updated `DIRECT_URL` to the Supabase direct PostgreSQL host on port `5432`. A non-destructive Prisma smoke test passed authentication and query execution.

## Failure Classification

`RESOLVED`

Specific blocker:

None for PostgreSQL staging connectivity.

## Actions Performed

- Secret-safe URL classification.
- Local env synchronization from the provided `dev.txt` file.
- Non-destructive Prisma authentication smoke test.
- Prisma migration retry.
- Prisma Client generation.
- Table verification.

## Actions Not Performed

- No destructive commands were run.
- No secrets were printed or written to reports.

## Required Fix

Keep `DATABASE_URL` pointed at the pooled runtime connection and `DIRECT_URL` pointed at the direct Supabase PostgreSQL connection. Do not commit either value.

No secrets are included in this report.
