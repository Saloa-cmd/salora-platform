# SALORA Migration Decision Log

Date: 2026-05-31
Source: `MIGRATION_BLUEPRINT_DEV_TO_SALORA.md`

| Item | Decision | Reason |
|---|---|---|
| Blueprint ingestion | Adapt | Replaced previous missing-blueprint assumption with true blueprint comparison. |
| Node version governance | Adapt | Added Node 22 files and engine pin; `.npmrc` keeps local validation possible on this Node 24 shell. |
| pnpm version | Adapt | Blueprint used pnpm 8.8.0, but SALORA lockfile/package already use pnpm 9.15.0; preserving avoids lockfile churn. |
| `.env.example` | Adapt | Expanded from DEV categories while preserving SALORA public env names. |
| Security/CSP middleware | Redesign | Implemented as Next.js middleware instead of Express middleware. |
| Request correlation | Redesign | Implemented in Next middleware and mobile client instead of Express AsyncLocalStorage. |
| Rate limiter | Redesign | Added safe in-memory limiter; Redis-backed production limiter is blocked on Redis. |
| Zod validation | Adapt | Added `zod` and a validated order preview route that matches SALORA domain. |
| Health/readiness/liveness | Redesign | Added App Router endpoints instead of copying Express server. |
| Metrics | Redesign | Added Prometheus text endpoint without `prom-client`; external scrape policy remains blocked. |
| Runtime inspect | Redesign | Added protected runtime endpoint scoped to current Next runtime. |
| OpenTelemetry collector config | Copy direct/adapt | Added safe collector reference config with debug exporter. |
| OpenTelemetry SDK | Blocked | Requires dependency adoption and exporter/provider destination policy. |
| Sentry SDK | Blocked | Requires DSN, release/source-map policy, and dependency adoption. |
| CI workflow | Adapt | Added audit and mobile typecheck to existing workflow. |
| Release validation | Redesign | Added workflow and health-check script for Next runtime. |
| Mobile EAS/API/observability | Adapt | Added EAS profile, env template, correlated API client, and observability facade. |
| Express API gateway | Intentionally skipped | Current SALORA architecture is Next.js; adding Express would duplicate deployable units. |
| Prisma/PostgreSQL | Blocked | Requires schema certainty, migration policy, and database provisioning. |
| Redis/BullMQ/DLQ | Blocked | Requires Redis provisioning and workload definitions. |
| JWT/RBAC | Blocked | Requires user/staff/admin role and policy decisions. |
| Stripe/payments | Blocked | Requires provider account, PCI/payment policy, webhook secrets. |
| WhatsApp Cloud API | Blocked | Requires Meta approval, templates, phone ID, token governance. |
| Gemini/OpenAI provider gateway | Blocked | Requires keys, safety policy, model policy, and cost governance. |
| Docker/Kubernetes manifests | Blocked | Requires deployment target, registry, secret manager, and network policy. |
| Socket.io realtime | Intentionally skipped | No current SALORA realtime use case; defer until product workflow requires it. |
| Phase 1 Prisma schema | Adapt | Added SALORA-specific users, roles, user_roles, and sessions instead of copying DEV wholesale. |
| Phase 1 migration SQL | Redesign | Wrote explicit PostgreSQL DDL and role seed values for the current schema. |
| Password hashing | Redesign | Used Node `scrypt` with per-password salts to avoid adding unnecessary crypto dependencies. |
| JWT access/refresh | Redesign | Implemented HS256 signing/verification with separate access and refresh secrets. |
| Auth API routes | Redesign | Implemented as Next.js App Router endpoints instead of Express controllers. |
| Runtime auth repository | Adapt | Added repository interface plus Prisma repository boundary; development fallback uses memory store, production requires PostgreSQL. |
| Prisma PostgreSQL adapter | Blocked | Prisma 7 requires a PostgreSQL adapter at runtime; network install did not complete in this environment, so schema/migration/client/repository are ready and production adapter completion is documented. |
