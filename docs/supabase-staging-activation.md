# Supabase Staging Activation

Date: 2026-06-01

## Purpose

Supabase staging PostgreSQL is the first real database activation target for SALORA. Its role is to validate migrations, schema compatibility, backup/restore readiness, runtime health, and controlled go-live readiness before production traffic.

## Required Connection Strings

- `DATABASE_URL`: runtime pooled connection string used by the application.
- `DIRECT_URL`: direct database connection string used by Prisma migrations.

No real credentials are stored in this repository or in this document.

## Runtime URL Strategy

Application runtime uses `DATABASE_URL`. This should point to the Supabase runtime/pooler URL appropriate for application traffic.

## Migration URL Strategy

Prisma migrations use `DIRECT_URL`. This should point to the direct Supabase PostgreSQL connection for schema migration operations.

The Prisma datasource includes:

```prisma
url       = env("DATABASE_URL")
directUrl = env("DIRECT_URL")
```

## Secret Storage Rules

- Store secrets only in local untracked env files or CI secret storage.
- Do not commit `.env` files.
- Do not add real values to `.env.example`.
- Do not print credentials in logs, docs, or terminal output.

## Staging-Only Policy

This activation is for staging only. Production activation requires a separate production database, separate credentials, separate backup policy, and explicit approval.

## Rollback Policy

Before any migration:

- Confirm Supabase backup availability.
- Record current migration state.
- Confirm rollback decision owner.
- Confirm application deployment rollback path.

If migration fails:

- Stop application deployment.
- Capture migration logs without secrets.
- Restore from backup if schema is partially applied and cannot be safely remediated.
- Do not retry destructive changes without review.

## Current Status

`DATABASE_URL` and `DIRECT_URL` were not present in the current shell environment or the referenced local secrets file during this run.

Status: `BLOCKED_BY_MISSING_STAGING_DATABASE_URL`.
