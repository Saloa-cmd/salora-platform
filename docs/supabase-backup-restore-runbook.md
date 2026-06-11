# Supabase Backup and Restore Runbook

Date: 2026-06-01

## Status

Procedure status: `PROCEDURE_READY`

Live drill status: `LIVE_DRILL_PENDING`

## Manual Supabase Backup Procedure

1. Open the Supabase staging project.
2. Confirm the correct project and environment.
3. Verify recent automated backups or create an on-demand backup if the plan supports it.
4. Record backup timestamp, operator, and migration target.
5. Confirm restore permissions before migration starts.

## Restore Drill Procedure

1. Select a staging restore point from before the migration.
2. Restore to an isolated staging branch or approved staging restore target.
3. Run schema validation.
4. Run application readiness checks.
5. Verify required tables and core seed records.
6. Record restore duration and validation result.

## Pre-Migration Backup Checklist

- Supabase project confirmed.
- `DATABASE_URL` and `DIRECT_URL` stored in secure local/CI secrets.
- Backup/restore owner assigned.
- Latest backup timestamp recorded.
- Migration list reviewed.
- Destructive-change review completed.
- Rollback decision owner assigned.

## Post-Restore Validation Checklist

- `users`, `roles`, and `sessions` exist.
- Product/catalog tables exist.
- Order/payment tables exist.
- Loyalty/notification/conversation tables exist.
- `runtime_configurations` exists.
- `/api/health` and `/api/ready` pass with staging environment.
- `/api/metrics` is protected by diagnostics token.

## Rollback Decision Tree

If migration fails before schema changes:

- Stop and fix configuration.

If migration partially applies:

- Assess whether Prisma migration state is consistent.
- If inconsistent or destructive, restore from backup.

If migration applies but app fails:

- Roll back application deployment first.
- If schema incompatibility remains, restore database backup.

If data integrity is affected:

- Stop staging writes.
- Restore from backup.
- Re-run migration only after root cause review.
