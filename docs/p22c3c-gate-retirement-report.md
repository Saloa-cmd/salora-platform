# P22C-3C Gate Retirement & Evidence Hardening

Status: **PR SCOPE — READY FOR VALIDATION**

## Scope and baseline

- Repository: `Saloa-cmd/salora-platform`
- Baseline branch: `main`
- Baseline commit: `5822201e43f3766e89680bae83e964d4d54220e0`
- Baseline Vercel Production deployment: `dpl_B1T6WYh6eR8UocoXTMn7U1gVRdc7`
- Working branch: `agent/p22c3c-gate-retirement-and-evidence-hardening`

This change retires the temporary P22C-3C runtime gates and minimizes public
operational evidence. It does not activate Menu Authority and does not execute
any database operation.

## Runtime surface retired

The following temporary routes are removed rather than left protected only by
an expiry timestamp:

- `/api/internal/p22c3c-http-transport-v5`
- `/api/internal/p22c3c-production-identity-readonly`
- `/api/internal/p22c3c-production-snapshot-readonly`
- `/api/internal/p22c3c-runtime-readonly`

Their dedicated runtime query module, Prisma read-only client, backend export,
hard-coded gate token hashes, and obsolete runtime-gate test are also removed.
The prepared SQL/DDL audit artifacts remain historical and are not executed by
this change.

## Evidence redaction contract

Public operational JSON is built from zero through
`createPublicOperationalStatus`. The builder copies only the allowlisted
`status` property and never passes through an internal object.

The regression test serializes a deliberately hostile nested evidence object
and recursively proves that fingerprints, slugs, secrets, tokens,
authorization values, connection strings, and database URLs are absent from
the resulting JSON.

## Health and readiness semantics

- `/api/health` is liveness-only, performs no infrastructure or database read,
  and returns only `{"status":"ok"}`.
- `/api/ready` continues to evaluate the live menu authority and required
  dependencies. It preserves the truthful `503` behavior when the published
  authority is unavailable, but exposes only `status` publicly.
- Detailed runtime inspection and metrics remain behind the existing
  `x-salora-diagnostics-token` header. No query-string authorization was added.
- Sentry build telemetry is disabled in source configuration; release uploads
  still remain conditional on the existing explicitly configured auth token.

## Secrets and environment references

- Temporary committed gate token hashes are removed with the retired routes.
- No dedicated P22C-3C Production environment variable was found or changed.
- `DATABASE_URL` remains a general application dependency and is not a
  retirement candidate.
- `DIAGNOSTICS_TOKEN` remains in use by the protected runtime inspection and
  metrics endpoints.
- No secret value is recorded in this report.

## POST-MERGE SECRET RETIREMENT CHECKLIST

These are manual verification actions only; this PR does not execute them:

1. Confirm the four retired paths return `404` on the new Production artifact
   after an independently approved merge and normal Git deployment.
2. Review historical Vercel deployment URLs and apply the organization's
   retention/protection policy so an old immutable deployment does not remain
   an unintended access path.
3. Confirm Vercel has no obsolete P22C-3C-only environment references before
   deleting anything. Environment mutation requires separate approval.
4. Preserve `DATABASE_URL` and `DIAGNOSTICS_TOKEN` because they are used by
   non-P22C-3C runtime features.

## CircleCI status

GitHub Actions (`SALORA CI`) and Vercel are the repository validation paths.
No `.circleci/config.yml` exists. The CircleCI error status is produced by an
external integration without repository configuration. Disabling that status
requires repository/CircleCI administrative UI access and is not performed by
this code change.

Manual action: remove or disable the unused CircleCI project/status integration
and keep only the approved GitHub Actions and Vercel required checks.

## PostgreSQL concurrency evidence

Vercel previously reported the `pg` warning for concurrent `client.query()`
execution on public menu and Control Tower routes. Repository evidence includes
parallel database-backed operations, but this PR does not claim a proven root
cause and does not redesign transaction architecture.

**DEFER TO PR #2 — Runtime Hardening**: reproduce with trace evidence, identify
the exact shared client/transaction boundary, then fix and regression-test it.

## Validation contract

- Source-level retirement test for all four routes and dedicated helpers.
- Runtime JSON serialization test with recursive sensitive-key rejection.
- Lint, TypeScript, relevant tests, complete test suite, and production build.
- Built route-manifest inspection proving the retired routes are absent.
- Security diff review before the PR is considered ready.
- GitHub CI and Vercel Preview validation after the branch is pushed.

## Production safety attestation

**NO PRODUCTION DATABASE WRITE PERFORMED**

**NO PRODUCTION MIGRATION / DDL / DML PERFORMED**

No Production Snapshot, Preflight, seed, environment mutation, secret rotation,
MenuCollectionRevision publication, Menu Authority activation, manual
Production deployment, or merge to `main` is part of this change.
