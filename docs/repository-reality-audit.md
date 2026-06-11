# SALORA Repository Reality Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Evidence Base

- Root workspace declares `apps/*` and `packages/*` in `pnpm-workspace.yaml`.
- Root scripts in `package.json` include `dev:web`, `build:web`, `lint`, `typecheck`, `test`, and Prisma commands.
- `apps/web/package.json` declares Next.js, React, Prisma, Sentry, Stripe, and SALORA internal packages.
- `apps/mobile/package.json` declares Expo, React Native, and SALORA internal packages.
- `prisma/schema.prisma` contains 56 models and 24 enums.
- `prisma/migrations` contains 9 migration directories.
- `docs` contains 291 markdown files in this workspace snapshot.
- `apps/web/app/api` contains 55 Next.js route handlers.

## Module Classification

| Module | Classification | Evidence | Reality Finding |
|---|---:|---|---|
| `apps/web` | ACTIVE | Next.js App Router pages, 55 API route handlers, successful `pnpm build`. | Primary web, API, dashboard, and Control Tower app. |
| `apps/mobile` | PARTIAL | Expo app exists and `pnpm typecheck` passed; API client defaults to `https://salora.cafe`; menu keeps static fallback products when API fetch fails. | Mobile shell is present but still fallback-tolerant. |
| `packages/backend` | ACTIVE | Auth, AI gateway, database, payments, runtime config, observability, and domain modules are imported by web routes. | Core server library for web API routes. |
| `packages/config` | ACTIVE | Site URL fallback and runtime config consumed by web/mobile. | Central config package. |
| `packages/data` | PARTIAL | Static product dataset used by public menu fallback, AI recommendation fallback, WhatsApp helpers, and tests. | Still operational fallback/mock layer, not pure seed data. |
| `packages/types` | ACTIVE | Shared types package declared in workspace dependencies. | Shared TypeScript contract package. |
| `prisma` | ACTIVE | `prisma validate` passed; `prisma generate` generated client to `packages/backend/src/database/generated`. | Canonical local schema source. |
| `apps/web/generated/prisma` | ORPHANED | `schema.prisma` generator output is `../packages/backend/src/database/generated`; search excluding generated/build artifacts found no source imports of `apps/web/generated/prisma`. | Duplicate generated artifact risk. Not removed in this audit. |
| `packages/backend/src/database/generated` | ACTIVE | Current Prisma generator output target. | Canonical generated Prisma client. |
| `docs` | PARTIAL | 291 markdown docs found. | Valuable evidence exists, but report sprawl is present. Needs doc governance/archive policy. |
| `scripts` | ACTIVE | `pnpm test` ran script-based checks for auth, infrastructure, business domains, AI, omnichannel, go-live, revenue, and operations. | Script tests are active validation assets. |

## Architecture Reality

- The platform is a monorepo with a Next.js web/API application, Expo mobile application, shared packages, and a Prisma-managed database schema.
- Control Tower is not a separate app. It is implemented inside `apps/web/app/(control-tower)/control-tower`.
- Several production-facing APIs still use in-memory or static fallback stores through `packages/backend/src/domains/services.ts` and `packages/data/src/index.ts`.
- Runtime responsibilities are split between Next.js route handlers and backend package service modules. This is workable, but some domain boundaries have drifted into duplicate API surfaces.

## Technical Debt

- Duplicate generated Prisma client output exists under `apps/web/generated/prisma`.
- Static/fallback product data remains active in web, mobile, AI, WhatsApp, and tests.
- Documentation volume is high enough to obscure current source-of-truth reports.
- API surfaces overlap for AI chat/concierge, WhatsApp webhooks, runtime config, orders, and Control Tower simple-launch endpoints.

## Cleanup Recommendation

- Do not delete active routes without traffic/config evidence.
- Add a tracked cleanup task for `apps/web/generated/prisma` after one build from a clean checkout confirms no dependency.
- Establish `docs/current/` versus `docs/archive/` or a report index before deleting old reports.
