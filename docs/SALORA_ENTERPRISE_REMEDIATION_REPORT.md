# SALORA Enterprise Remediation Report

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Final Decision

`READY_FOR_SOFT_LAUNCH_RECHECK`

This is not a production-ready certification. It means critical security remediation was applied and the platform is ready for a focused soft-launch recheck.

## Remediation Completed

- Public registration role self-assignment removed.
- New password hashes migrated to Argon2id.
- Legacy scrypt password verification preserved.
- Auth login/register/refresh now issue HTTP-only cookies.
- Logout clears HTTP-only auth cookies.
- Control Tower pages now perform server-side JWT validation and role checks.
- Control Tower allowed roles are `STAFF`, `MANAGER`, `ADMIN`.
- Missing bearer token in Control Tower APIs now returns 401.
- Secure admin bootstrap script added with environment-only inputs.
- Admin bootstrap writes ActivityLog and AuditLog and marks password rotation required.
- Control Tower list routes now have bounded `limit`/`offset` support.
- Website/mobile fallback modes are now visible.
- `/api/products` and `/api/ready` expose runtime truth metadata.
- API ownership map produced without deleting backward-compatible endpoints.

## Validation Results

| Validation | Result |
|---|---:|
| `node --experimental-strip-types scripts/auth-foundation.test.mjs` | PASS |
| `prisma validate --schema prisma/schema.prisma` | PASS |
| `prisma generate --schema prisma/schema.prisma` | PASS |
| `prisma migrate status --schema prisma/schema.prisma` | FAIL/UNKNOWN |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS |
| `pnpm build` | PASS |

## Known Warnings

- Nested pnpm invocations report Node `v24.15.0` while root engine requires `>=22 <23`.
- Node test runner still reports `MODULE_TYPELESS_PACKAGE_JSON` for direct TypeScript imports in script tests.
- Supabase migration status could not be certified from this environment because Prisma returned `Schema engine error`.
- Final `pnpm build` compiled successfully in 69 seconds, completed TypeScript in 37.3 seconds, and generated 34 static pages.

## Current Architecture Artifacts

### Folder Structure

- `apps/web`: Next.js UI, API routes, Control Tower, auth.
- `apps/mobile`: Expo mobile shell.
- `packages/backend`: Prisma, AI, payments, runtime, observability, domain services.
- `packages/data`: static fallback data.
- `prisma`: canonical schema and migrations.
- `scripts`: validation and bootstrap operations.
- `docs`: audit and remediation evidence.

### Service Boundaries

- Control Tower owns operator workflows.
- Public website owns guest menu/ordering entry points.
- Mobile consumes public APIs and displays fallback mode when needed.
- Prisma remains the application write layer.
- Supabase/PostgreSQL remains intended commercial source of truth.
- External providers remain OpenAI, Stripe, WhatsApp, Instagram, Sentry, Redis/BullMQ.

### API Contracts

- Privileged Control Tower APIs require bearer token RBAC.
- Control Tower pages require HTTP-only access cookie with `STAFF`, `MANAGER`, or `ADMIN`.
- Public registration always creates `CUSTOMER`.
- `/api/products` returns `{ requestId, data, runtime }`.
- Legacy product array handling remains supported in mobile.

### Event Flows

- Control Tower writes create ActivityLog and AuditLog entries.
- Admin bootstrap creates ActivityLog and AuditLog entries.
- Order updates can emit WhatsApp order notifications.
- AI draft workflows persist recommendation/media draft records before publication.

### Deployment Strategy

- Keep soft launch restricted.
- Run live Supabase migration certification before launch recheck.
- Run provider smoke tests for OpenAI, Stripe, WhatsApp, Instagram, and Sentry.
- Do not remove legacy APIs until traffic/config evidence exists.

### Observability Strategy

- Use `requestId` as correlation ID.
- Preserve AuditLog and ActivityLog.
- Surface fallback runtime state in website, mobile, `/api/products`, and `/api/ready`.
- Add route-level traffic metrics before endpoint deprecation.

## Remaining Risks

- Live Supabase migration state is unknown.
- Control Tower UI still needs lazy loading by section.
- AI and WhatsApp fallback/provider modes need deeper Control Tower operator visibility.
- Admin password rotation is marked but not yet enforced by a dedicated UX.
- Inventory/customers remain partially certified.

## Recommendation

Proceed to a controlled soft-launch recheck only after live Supabase migration status and provider smoke tests are completed.
