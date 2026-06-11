# SALORA Staging Deployment Readiness

Date: 2026-06-08

Scope: `prisma/schema.prisma`, `prisma/migrations`, `prisma/migrations/20260608_security_hardening/migration.sql`, `prisma/migrations/20260608_security_hardening/rollback_strategy.sql`, validation gate outputs.

No migration was applied. No SQL was executed except read-only inspection.

## Decision

BLOCKED

The draft security-hardening migration is non-destructive in text review, but staging deployment is blocked because the policy SQL requires changes, `prisma migrate status` failed with a schema-engine error, and `prisma generate` failed with an EPERM file-lock issue.

## Migration Chain Review

| Check | Result | Evidence |
| --- | --- | --- |
| Draft migration location | Present | `prisma/migrations/20260608_security_hardening/migration.sql` |
| Rollback strategy | Present | `prisma/migrations/20260608_security_hardening/rollback_strategy.sql` |
| Destructive statements | Not found in text search | No `drop table`, `drop column`, `truncate`, `delete from`, or `alter table ... drop` matches |
| RLS enablement | Present | `alter table public.* enable row level security` in draft migration |
| Policy creation | Present | `create policy ...` in draft migration |
| Idempotence | Not certified | `create policy` will fail if policy names already exist |
| Policy correctness | Not certified | JWT role extraction and Supabase/app-auth claim alignment risks remain |
| Migration status | Not certified | `prisma migrate status` returned `Schema engine error` |

## Validation Gate Results

| Command | Result | Output Summary |
| --- | --- | --- |
| `prisma validate` | PASS | `The schema at prisma\schema.prisma is valid` |
| `prisma generate` | FAIL | `EPERM: operation not permitted, unlink 'C:\dev\salora-platform\packages\backend\src\database\generated\client.ts'` |
| `prisma migrate status` | FAIL | Loaded Supabase datasource, then `Error: Schema engine error:` |
| `pnpm lint` | PASS | ESLint completed for `@salora/web`; pnpm reported Node v24 despite requested Node 22 path |
| `pnpm typecheck` | PASS | Web and mobile `tsc --noEmit` completed; pnpm reported Node v24 despite requested Node 22 path |
| `pnpm test` | PASS | Typecheck plus data, auth, infrastructure, business, AI, omnichannel, production activation, go-live, revenue, and operations tests passed |
| `pnpm build` | PASS | Next.js production build completed and generated 34 static pages; pnpm reported Node v24 despite requested Node 22 path |

## Required Actions

1. Release the Prisma generated client file lock and rerun `prisma generate`.
2. Resolve `prisma migrate status` schema-engine failure before any staging migration review.
3. Correct generated RLS helper/policy risks documented in `docs/database-security-certification.md`.
4. Re-run validation using a shell where `pnpm` actually executes under Node 22, or document why the local pnpm shim resolves to Node v24.
5. Require human approval before applying any RLS migration.

