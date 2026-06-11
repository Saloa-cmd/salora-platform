# Supabase Prisma Connection Remediation

Date: 2026-06-01

## Secret-Safe Classification

No connection string, username, password, or full host is included in this report.

| Variable | Classification | Port | Pooler | Direct | Result |
|---|---|---:|---|---|---|
| `DATABASE_URL` | Supabase pooled runtime URL | 6543 | Yes | No | Correct for runtime |
| `DIRECT_URL` | Supabase pooler URL | 5432 | Yes | No | Incorrect for migrations |

## Root Cause Classification

`DIRECT_URL_MUST_BE_DIRECT_CONNECTION`

The previous migration failure is consistent with Prisma schema engine attempting migration operations through a Supabase pooler URL. Prisma migrations require a direct PostgreSQL connection URL.

## Required Supabase URL Strategy

- `DATABASE_URL`: pooled runtime connection. This is appropriate for application runtime traffic.
- `DIRECT_URL`: direct PostgreSQL connection. This is required for Prisma migration operations.

## Why Pooler Fails for Migrations

Supabase pooled connections are designed for runtime query traffic. Prisma migration/schema engine operations need direct database capabilities and can fail when routed through a pooler.

## Prisma 7 Configuration

This project uses Prisma 7. Connection URLs are not stored in `schema.prisma`.

The migration URL is configured in `prisma.config.ts`:

```ts
const migrationUrl = process.env.DIRECT_URL || env("DATABASE_URL");
```

Runtime Prisma access continues to use `DATABASE_URL` through the PostgreSQL adapter in application code.

## Remediation Required

Replace `DIRECT_URL` with the Supabase direct PostgreSQL connection string. It should classify as:

- host type: `supabase-direct`
- direct: `true`
- pooler: `false`

Do not commit the value. Store it only in `.env`, `.env.local`, or CI secrets.

## Execution Status

Latest execution updated `DIRECT_URL` to the Supabase direct PostgreSQL connection and synchronized local untracked env files without exposing secrets.

Secret-safe classification now shows:

- `DATABASE_URL`: Supabase pooled runtime URL on port `6543` with `pgbouncer=true`; runtime-ready.
- `DIRECT_URL`: Supabase direct PostgreSQL URL on port `5432`; migration-ready.

A non-destructive Prisma smoke test passed authentication and query execution against `DIRECT_URL`.

Current blocker: none for PostgreSQL staging migration connectivity.
