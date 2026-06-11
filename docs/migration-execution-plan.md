# SALORA Migration Execution Plan

Date: 2026-05-31

## Assumptions

- The missing blueprint will be restored later and reconciled as a follow-up pass.
- SALORA must remain buildable after each migration phase.
- No network dependency installation is assumed during migration.

## Phase Order

| Phase | Effort | Risk | Dependencies | Implementation |
|---|---:|---|---|---|
| 1. Foundation | S | Medium | Existing monorepo | Add env contract, package scripts, migration docs |
| 2. Runtime & Observability | S | Low | Next.js App Router | Add `/api/health`, instrumentation hook, SEO probes |
| 3. Security | S | Medium | Next config | Add security headers and runtime config boundaries |
| 4. Performance | S | Low | Static web build | Keep static routes, compression, metadata base, lean checks |
| 5. CI/CD | S | Medium | pnpm lockfile | Add GitHub Actions lint/typecheck/test/build workflow |
| 6. Mobile Platform | S | Medium | Expo config | Add bundle/package IDs, EAS build profile, permission minimization |
| 7. Production Hardening | M | High | Blueprint/backend decisions | Requires real Supabase, auth, RLS, payments, WhatsApp Cloud API |
| 8. Launch Readiness | M | High | Production hardening | Requires end-to-end staging validation |

## Required Validation

- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `pnpm.cmd build`

## Deferred Dependencies

- Restored `MIGRATION_BLUEPRINT_DEV_TO_SALORA.md`
- Supabase project and schema
- Auth policy and RLS rules
- WhatsApp Cloud API credentials
- Payment provider credentials
- Observability provider DSNs and dashboard ownership

