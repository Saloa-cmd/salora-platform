# SALORA RLS Remediation Plan

Date: 2026-06-08

Scope:

- `docs/rls-root-cause-analysis.md`
- `docs/database-security-certification.md`
- `docs/generated-rls-policies.sql`
- `prisma/migrations/20260608_security_hardening/migration.sql`

No SQL was executed. No policy was deployed. No production data was modified.

## Decision

RLS_READY_FOR_STAGING

The local RLS package is ready for a controlled staging deployment review. This is not approval to execute it in production.

## Remediation Applied

| Issue | Fix | Evidence |
| --- | --- | --- |
| `salora_jwt_roles()` ignored single-role fallback when roles array was absent or empty | Rewrote helper to use non-empty `app_metadata.roles`, otherwise fallback to `app_metadata.role`, otherwise empty array | `docs/generated-rls-policies.sql`; `prisma/migrations/20260608_security_hardening/migration.sql` |
| Policy naming conflicts on rerun | Added `drop policy if exists` for all 89 policies before `create policy` statements | 89 drop guards before 89 create policies |
| Draft SQL and migration drift | Synced reviewed SQL package into the local migration draft | `docs/generated-rls-policies.sql` matches `prisma/migrations/20260608_security_hardening/migration.sql` |
| Prisma compatibility ambiguity | Documented staging validation requirement for exact runtime DB role before production use | This plan and staging playbook |

## Role Fallback Behavior

Expected behavior after remediation:

| JWT App Metadata | Returned Roles |
| --- | --- |
| `{ "roles": ["ADMIN"] }` | `ADMIN` |
| `{ "roles": ["MANAGER", "STAFF"] }` | `MANAGER`, `STAFF` |
| `{ "roles": [] , "role": "ADMIN" }` | `ADMIN` |
| `{ "role": "STAFF" }` | `STAFF` |
| `{}` | empty role array |
| `service_role` database auth role | passes `salora_has_role()` service-role branch |

## Policy Deployment Safety

The package now uses deterministic policy replacement:

1. `alter table ... enable row level security`
2. `drop policy if exists ...`
3. `create policy ...`

This prevents staging reruns from failing on existing policy names. It does not delete table data.

## Prisma Compatibility Requirements

Before staging execution, confirm:

- The app runtime connection role is known.
- The migration connection role is known.
- Website public catalog reads still work after RLS.
- Control Tower server-side Prisma reads/writes still work after RLS.
- Service-only domains such as payments, WhatsApp provider events, audit/activity writes, and notification delivery logs are not blocked.

## Staging Deployment Guardrails

Do not deploy unless all are true:

- Supabase backup exists.
- `prisma generate` passes.
- `prisma migrate status` reports only the intended pending migration.
- RLS package has been reviewed by database/security owner.
- Auth package has approved JWT secrets for staging.
- Rollback path is approved.

## Remaining Explicit Non-Production Caveat

The package is ready for staging execution, not production execution. Production readiness requires successful staging evidence after applying the migration.

