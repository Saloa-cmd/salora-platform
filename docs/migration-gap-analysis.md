# SALORA True DEV Parity Gap Analysis

Date: 2026-05-31
Source: `MIGRATION_BLUEPRINT_DEV_TO_SALORA.md`

## Blueprint Ingestion Status

The blueprint has been read and supersedes the previous limited migration analysis. DEV is a full-stack command-center platform with Express, Prisma/PostgreSQL, Redis/BullMQ, Socket.io, AI provider modules, OpenTelemetry, Sentry, Prometheus, CI/CD, deployment governance, and a separate Expo mobile workspace. Current SALORA remains a Next.js + Expo + shared packages monorepo, so parity must be achieved by adapting safe production foundations first and blocking items that require real infrastructure decisions.

## Coverage Matrix

| Blueprint Area | Status | SALORA Result |
|---|---|---|
| Node 22 runtime governance | Implemented | Added `.node-version`, `.nvmrc`, engine pin, CI Node 22. Local shell is Node 24, so `.npmrc` allows validation with warnings. |
| pnpm/workspace governance | Implemented | Preserved SALORA pnpm 9.15 lockfile and workspace layout. |
| Env schema/template | Implemented | Expanded `.env.example` for core, data, Redis, auth, AI, payments, OTel, Sentry, mobile, release checks. |
| Health endpoint | Implemented | `/api/health`. |
| Readiness endpoint | Implemented | `/api/ready`. |
| Liveness endpoint | Implemented | `/api/live`. |
| Runtime inspect | Implemented | `/api/runtime/inspect`, token-protected in production. |
| Request correlation | Implemented | Middleware creates/propagates `x-request-id`; mobile API client sends request IDs. |
| Security middleware/CSP | Partially implemented | Middleware adds CSP and hardening headers. Inline allowance remains until nonce/hash policy is decided. |
| Rate limiting | Partially implemented | Single-instance in-memory limiter added. Redis-backed distributed limiter blocked on Redis runtime. |
| Zod validation | Implemented | Added `zod` and validated `/api/order-preview`. |
| Metrics | Implemented | `/api/metrics` emits Prometheus text metrics and is token-protected in production. |
| OpenTelemetry | Partially implemented | OTel collector configs and env contract added. SDK instrumentation blocked on dependency/provider decision. |
| Sentry | Partially implemented | Env contract and mobile/server observability facades documented. SDK init blocked on DSN/source-map policy. |
| CI/CD | Implemented | CI workflow includes lint, test, build, audit, mobile typecheck. |
| Release validation | Implemented | Added release workflow and `scripts/release-health-check.mjs`. |
| Mobile Expo readiness | Implemented | EAS profile, app identifiers, mobile env, request-id API client, observability facade. Real EAS project ID remains blocked. |
| Deployment docs | Implemented | Added production deployment, security, observability, mobile readiness docs. |
| Performance optimization | Partially implemented | Static Next build, compression, metrics, readiness gates. Queue pressure/BullMQ blocked on Redis/BullMQ adoption. |
| Bundle splitting | Partially implemented | Next.js handles route splitting; deeper bundle-budget tooling remains future work. |
| Express API gateway | Intentionally skipped | SALORA uses Next.js App Router; adding Express would duplicate architecture. |
| Prisma/PostgreSQL | Blocked | Requires schema certainty and database provisioning. |
| Redis/BullMQ queues | Blocked | Requires Redis provisioning and queue workload decisions. |
| JWT/RBAC | Blocked | Requires auth model, roles, staff/customer policy. |
| Payments/Stripe | Blocked | Requires provider setup, PCI/payment policy, credentials. |
| WhatsApp Cloud API | Blocked | Requires Meta approval, phone ID, tokens, message template policy. |
| AI provider gateway/Gemini | Blocked | Requires provider strategy, keys, safety policy, cost policy. |
| Socket.io realtime | Intentionally skipped | No current SALORA realtime workflow; would add unnecessary runtime surface. |
| Docker/Kubernetes | Blocked | Requires deployment target, image registry, secret manager, network policy. |

## Critical Remaining Gaps

- No live backend persistence, auth, payment, WhatsApp Cloud API, or AI provider runtime.
- No Redis-backed distributed rate limiter, queue domains, DLQ, or queue pressure controller.
- No Sentry/OTel SDK packages wired into runtime because credentials and provider decisions are absent.
- No admin operational dashboard beyond placeholder docs.

## Architecture Artifacts

Folder structure: SALORA remains `apps/web`, `apps/mobile`, `apps/admin`, and shared `packages/*`, with governance docs, CI, OTel config, and scripts added at root.

Service boundaries: web storefront and API probes in `apps/web`; Expo client in `apps/mobile`; catalog/order/WhatsApp domain logic in `packages/data`; runtime config in `packages/config`.

API contracts: `/api/health`, `/api/live`, `/api/ready`, `/api/metrics`, `/api/runtime/inspect`, `/api/order-preview`.

Event flow: mobile or web sends correlated request -> middleware applies request ID/security/rate limit -> route validates with Zod -> data package generates order draft/WhatsApp output -> health and metrics expose operational state.

Deployment strategy: CI verifies lint/typecheck/test/build on Node 22; release validation starts the built web server and checks health/readiness/liveness.

Observability strategy: correlation IDs now exist everywhere safe; metrics and diagnostics are present; Sentry and OTel provider SDKs are blocked until credentials/provider policy are approved.
