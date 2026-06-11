# SALORA Prisma Runtime Certification v3.0

Date: 2026-06-08

Scope:

- Prisma runtime and generator
- `prisma.config.ts`
- `prisma/schema.prisma`
- `packages/backend/src/database/prisma.ts`
- `packages/backend/src/database/generated`
- Validation gates

No migration was applied. No database writes were performed by this certification.

## Decision

PRISMA_BLOCKED

## Executive Finding

Prisma runtime cannot be certified. `prisma validate` passes and read-only Prisma counts can reach Supabase when run with escalated network access, but `prisma generate`, `prisma migrate status`, and `pnpm build` currently expose runtime/tooling blockers.

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Prisma schema | PASS | `The schema at prisma\schema.prisma is valid` |
| Prisma generator | FAIL | `EPERM: operation not permitted, unlink ... generated\browser.ts`; prior run failed on `generated\client.ts` |
| Prisma migrate status | FAIL | Supabase datasource loaded, then `Error: Schema engine error:` |
| Build artifact access | FAIL | `EPERM: operation not permitted, open ... apps\web\.next\trace` |
| Generated file attributes | Not read-only | `client.ts` has `Archive`, `IsReadOnly=False` |
| Generated file ACL | Modify allowed | Owner and sandbox users have modify permissions |
| Node version | Not aligned | `pnpm.cmd` resolves to Node v24.15.0 while root `package.json` requires `>=22 <23` |
| Bundled Node | Present | `C:\dev\.tools\node-v22.22.3-win-x64\node.exe` reports v22.22.3 |
| Supabase connectivity | Partial | Read-only counts succeeded with escalated network access; non-escalated Node 22 query hit `EACCES` |

## Root Cause Classification

| Suspected Cause | Classification | Evidence |
| --- | --- | --- |
| Schema syntax | Ruled out | `prisma validate` passes. |
| Single corrupt generated file | Unlikely | EPERM moved from `client.ts` to `browser.ts` between runs. |
| File read-only attribute | Ruled out | Generated file is not read-only. |
| Basic ACL denial | Unlikely | ACL grants modify rights to owner and sandbox users. |
| Active file lock / Windows filesystem protection | Likely | Prisma and Next both fail on generated/build artifact writes with EPERM. |
| Node version mismatch | Contributing risk | pnpm uses Node v24 despite project engine `>=22 <23`. |
| Supabase total outage | Ruled out | Read-only counts reached Supabase under escalated network access. |
| Prisma schema engine / migration connection issue | Active blocker | `migrate status` fails after loading datasource with schema-engine error. |

## Validation Gate Results

| Command | Result | Exact Output Summary |
| --- | --- | --- |
| `prisma validate` | PASS | `The schema at prisma\schema.prisma is valid` |
| `prisma generate` | FAIL | `EPERM: operation not permitted, unlink 'C:\dev\salora-platform\packages\backend\src\database\generated\browser.ts'` |
| `prisma migrate status` | FAIL | Datasource loaded, then `Error: Schema engine error:` |
| `pnpm lint` | PASS | ESLint completed; warning: Node v24.15.0 while engine wants `>=22 <23` |
| `pnpm typecheck` | PASS | Web and mobile `tsc --noEmit` completed; Node v24 warning |
| `pnpm test` | PASS | All scripted suites passed; Node module type warning in auth crypto |
| `pnpm build` | FAIL | `EPERM: operation not permitted, open 'C:\dev\salora-platform\apps\web\.next\trace'` |

## Exact Remediation Steps

1. Close all SALORA dev/build processes and any editor/indexer currently watching `packages/backend/src/database/generated` or `apps/web/.next`.
2. Ensure shell uses Node 22 for pnpm, not global Node 24. Recommended local command pattern:
   - call the bundled Node 22 binary explicitly, or install/activate pnpm under Node 22.
3. Remove only generated build artifacts after confirming paths:
   - `C:\dev\salora-platform\apps\web\.next`
   - regenerated Prisma output only through `prisma generate`, not manual edits.
4. Re-run:
   - `prisma generate`
   - `prisma migrate status`
   - `pnpm build`
5. If `migrate status` still fails, run Prisma with sanitized debug output and verify:
   - `DIRECT_URL` is the correct direct Supabase PostgreSQL connection.
   - SSL requirements are satisfied.
   - Prisma 7 schema engine can access the host from the execution environment.
6. Do not apply RLS migration until `migrate status` and `generate` both pass.

