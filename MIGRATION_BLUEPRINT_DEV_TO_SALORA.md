# MIGRATION BLUEPRINT: DEV TO SALORA

Generated: 2026-05-31  
Source project: DEV (`C:\dev\salora-café`)  
Target project: SALORA  
Scope: forensic engineering audit and migration reference only. No migration was performed.

## Executive Summary

DEV is a full-stack SALORA command-center platform, not a small frontend prototype. It contains a Vite/React web app, Express backend, Prisma/PostgreSQL model, Redis/BullMQ runtime, Socket.io realtime layer, AI provider/gateway modules, OpenTelemetry/Sentry/Prometheus observability, deployment manifests, GitHub Actions quality gates, Storybook/design-system assets, and a separate Expo mobile workspace.

Important repository note: the DEV git status reports the project files as untracked in the current repository. There is no reliable baseline diff to separate "modified" from "new" work. For migration purposes, this blueprint treats the entire current project tree as the DEV improvement set and classifies assets by migration value.

Recommended migration posture: do not copy the whole repository into SALORA. Migrate the production-grade foundations first: runtime config, API contracts, observability, security middleware, CI/CD, Redis/BullMQ queue governance, and mobile app structure. Adapt AI/product-specific modules after the core platform compiles and health checks pass.

## Architecture Inventory

### Folder Structure

| Path | Purpose | Migration recommendation |
|---|---|---|
| `.github/` | CODEOWNERS, PR templates, commit template, GitHub Actions workflows. | Copy/adapt. |
| `.storybook/` | Storybook config and custom design audit panels. | Optional/adapt after design-system migration. |
| `animations/` | Web animation primitives for cards, gestures, loading, page transitions, scroll. | Optional/adapt. |
| `deployment/` | Release, rollout, rollback, quality-gate, GitHub, security, and production readiness docs. | Copy as governance reference. |
| `design-system/` | Tokens, theme, motion, components, standards, stories. | High-value; adapt to SALORA UI conventions. |
| `docs/infrastructure/` | npm/pnpm recovery, bootstrap verification, dependency matrix, session notes. | Copy as lessons learned. |
| `grafana/dashboards/` | Queue overview dashboard JSON. | Adapt to actual metric names and Prometheus datasource. |
| `k8s/`, `k8s-deployment.yaml` | Kubernetes deployment/service/Redis/OTel collector manifests. | Adapt; do not copy image names/secrets blindly. |
| `mobile/` | Expo Router mobile app workspace. | High-value if SALORA needs mobile. |
| `observability/` | OTel collector config duplicate/reference. | Copy/adapt. |
| `prisma/` | PostgreSQL schema. | Adapt to SALORA data model. |
| `reviews/` | UI review reference folder. | Optional. |
| `screens/` | Modular HomeScreen implementation sample. | Optional/adapt. |
| `scripts/` | Windows/Linux setup, integration verification, stress, worker manager scripts. | Copy/adapt; validate paths. |
| `src/ai/` | AI agents, providers, gateway, embeddings, context, generation, recommendation, voice, workflow, personalization. | Adapt selectively. |
| `src/analytics/` | UX analytics engines. | Optional/reimplement. |
| `src/api/` | Express routers and API tests. | Copy/adapt. |
| `src/components/` | React command-center panels. | Adapt if SALORA uses same admin UI. |
| `src/config/`, `src/core/` | Environment, container, lifecycle, queue, logger, telemetry, shutdown. | P0 foundation. |
| `src/controllers/`, `src/services/`, `src/models/` | Backend business use cases. | Adapt to SALORA domain. |
| `src/db/` | Prisma and Redis clients. | P0 adapt. |
| `src/design-system/` | Design validation/intelligence utilities. | Recommended after design system. |
| `src/diagnostics/`, `src/health/` | Runtime, queue, memory, stream, telemetry diagnostics. | P1 adapt. |
| `src/events/` | Event bus, event handlers, event types. | P1 adapt. |
| `src/jobs/`, `src/workers/` | BullMQ jobs, worker logic, DLQ, retry/backoff. | P0/P1 adapt. |
| `src/kernel/`, `src/runtime/` | Startup orchestration, runtime state, supervisor, recovery, queues, stream transport. | P0/P1 adapt carefully. |
| `src/middlewares/`, `src/security/` | Security headers, auth, rate limiting, AI safety filters. | P0/P1 adapt. |
| `src/monitoring/`, `src/observability/`, `src/telemetry/` | Sentry, OTel, Prometheus, runtime context, error tracking. | P0 migrate. |
| `src/realtime/`, `src/streaming/` | Socket.io and streaming heartbeats. | P1 if realtime required. |
| root `*Screen.tsx`, `*Slice.ts`, `*Service.ts`, hooks | Legacy React Native/Redux-style screen and state assets. | Mostly adapt/skip; avoid duplicating with `mobile/`. |

### Application Architecture

DEV is a TypeScript monorepo managed by `pnpm-workspace.yaml` with two packages:

| Workspace | Stack | Entry points |
|---|---|---|
| Root app | Express + Vite + React + Prisma + BullMQ + Socket.io | `server.ts`, `src/main.tsx`, `src/App.tsx` |
| Mobile app | Expo Router + React Native + React Query + Zustand + NativeWind | `mobile/app/_layout.tsx`, `mobile/package.json` |

The root server is a combined API and frontend host:

1. Express app starts in `server.ts`.
2. Security, correlation, request logging, JSON parsing, and `/api/v1` routes are mounted.
3. Health/readiness/liveness endpoints are exposed outside `/api/v1`.
4. Gemini AI endpoints are mounted directly under `/api/gemini/*`.
5. Development uses Vite middleware; production serves `dist`.
6. HTTP server wraps Express for Socket.io upgrade handling.
7. Kernel, SALORA infrastructure, event handlers, background jobs, runtime supervisor, runtime controller, and Prometheus are started during bootstrap.

### Frontend Architecture

Web frontend assets are split across:

| Area | Files | Notes |
|---|---|---|
| Main app | `src/main.tsx`, `src/App.tsx`, `src/CustomerApp.tsx`, `src/index.css` | Vite/React shell. |
| Command-center panels | `src/components/*.tsx` | AI brain, content studio, visual hub, automation, analytics, database, CMS, team, iOS hub. |
| Design system | `design-system/**` | Tokens, theme CSS, UI components, component docs, stories, standards. |
| Screen module example | `screens/HomeScreen/**` | More modular screen architecture. |
| Legacy/mobile-like screens | root `HomeScreen.tsx`, `LoginScreen.tsx`, etc. | Should be rationalized during migration. |
| State hooks/slices | root `*Slice.ts`, `use*.ts`, `app-store.ts` | Redux-style assets; target should choose one state model. |

Production readiness: frontend structure is feature-rich but fragmented. SALORA should migrate the design tokens and mature panels selectively, then consolidate root-level screen/state files into the target app's chosen architecture.

### Backend Architecture

| Layer | Files | Responsibility |
|---|---|---|
| Server composition | `server.ts` | HTTP app, middleware, routes, health checks, Vite/static host, Socket.io, bootstrap. |
| API routing | `src/api/routes.ts`, `src/api/*.routes.ts` | Auth, products, orders, system, diagnostics, admin queues. |
| Controllers | `src/controllers/*.ts` | Request/response orchestration. |
| Services | `src/services/*.ts` | Auth, orders, products, loyalty, notifications, payment, theme, AI service logic. |
| Data | `prisma/schema.prisma`, `src/db/prisma.ts`, `src/db/redis.ts` | PostgreSQL schema and Redis client/fallback. |
| Middleware | `src/middlewares/*.ts` | JWT auth, role guards, rate limiting, security headers, request logger. |
| Reliability/runtime | `src/runtime/**`, `src/kernel/**`, `src/reliability/**` | Startup ordering, readiness, supervisor, recovery, rate limits, circuit breakers. |
| Jobs | `src/jobs/**`, `src/workers/**` | BullMQ domains, DLQ, workers, retry/backoff, background jobs. |

### Runtime Architecture

Runtime concerns implemented in DEV:

| Capability | Files | Migration priority |
|---|---|---|
| Deterministic bootstrap | `src/kernel/index.ts`, `src/kernel/bootstrap/**` | P0 |
| Runtime status/readiness | `src/runtime/runtimeState.ts`, `server.ts` | P0 |
| Queue domains | `src/jobs/bullmqIntegration.ts`, `src/core/queue.ts` | P0 |
| Runtime supervisor | `src/runtime/supervisor/**`, `scripts/worker/supervisor.mjs` | P1 |
| Runtime controller/recovery | `src/runtime/control/runtimeController.ts`, `src/runtime/recovery/recoveryOrchestrator.ts`, `src/runtime/queues/queuePressureAnalyzer.ts` | P1 |
| Health endpoints | `/api/health`, `/api/ready`, `/api/live`, `/api/runtime/inspect` in `server.ts` | P0 |
| Graceful shutdown | `server.ts`, `src/core/shutdown.ts` | P0 |

Runtime warning: `Dockerfile` uses Node 20 images while `package.json` requires Node `>=22 <23`. SALORA should standardize on Node 22 for local, CI, and container runtime.

### Observability Architecture

DEV includes three parallel observability surfaces:

| Surface | Files | Function |
|---|---|---|
| OpenTelemetry | `src/observability/opentelemetry.ts`, `src/telemetry/otel-bootstrap.ts`, `otel-collector-config.yml`, `observability/otel-collector-config.yml`, `k8s/otel-collector.yaml` | NodeSDK, auto-instrumentation, OTLP traces/metrics exporters. |
| Sentry | `src/observability/sentry.ts`, `src/telemetry/sentry-init.ts`, `src/monitoring/sentry.ts`, `mobile/services/observability.ts` | Server and mobile error tracking with redaction. |
| Prometheus | `src/telemetry/prometheus.ts`, `grafana/dashboards/queue-overview.json` | `/metrics` endpoint, default Node metrics, event loop, heap, BullMQ queue gauges. |

### Deployment Architecture

| Target | Files | Notes |
|---|---|---|
| Local dev | `pnpm run dev`, `docker-compose.yml`, `.env.example` | Starts Express/Vite via `tsx server.ts`; Redis and OTel collector via compose. |
| Production Node | `pnpm run build`, `pnpm start`, `dist/server.cjs` | Vite build plus esbuild server bundle. |
| Docker | `Dockerfile` | Multi-stage build; fix Node version to 22 before migration. |
| Kubernetes | `k8s/deployment.yaml`, `k8s/service.yaml`, `k8s/redis-deployment.yaml`, `k8s/otel-collector.yaml` | Has probes and resource requests; must externalize secrets. |
| CI release validation | `.github/workflows/release-validation.yml`, `scripts/integration/staging-health-check.mjs` | Starts release candidate and validates health. |

### AI Architecture

DEV has both direct Gemini endpoints and a broader provider-agnostic AI subsystem.

| Area | Files | Purpose | Migration priority |
|---|---|---|---|
| Direct Gemini API | `server.ts` `/api/gemini/chat`, `/api/gemini/content`, `/api/gemini/visual` | Executive assistant, content studio, visual prompt generator. | P1 adapt; validate model names and API. |
| Provider adapters | `src/ai/providers/*Provider.ts`, `src/sdk/ai/UnifiedAISDK.ts` | OpenAI, Gemini, Claude, Ollama abstractions. | P1/P2 adapt. |
| Gateway | `src/ai/gateway/**` | Routing, provider selection, fallback, cost optimization, model policy. | P1 adapt if SALORA has multi-provider AI. |
| Memory/embeddings | `src/ai/embeddings/**`, `src/ai/memory/**`, `src/store/ai/memorySlice.ts` | Semantic search/vector memory/customer memory. | P2; requires real vector backend. |
| Recommendations/taste | `src/ai/recommendation/**`, `src/ai/taste/**` | Behavior analysis, pairing, taste profile. | P2 adapt to data quality. |
| Design/review AI | `src/ai/design/**`, `src/ai/review/**` | Screen planning, component composing, UI review. | P2/P3. |
| Security AI | `src/security/ai/**` | Prompt protection, rate limiting, context filtering, abuse detection. | P1. |
| Workflow/agents | `src/ai/workflows/**`, `src/ai/agents/**`, `src/ai/orchestration/**` | Agent coordination and automation flows. | P2; migrate after contracts are stable. |

### Mobile Architecture

The mobile app is a separate Expo workspace:

| Area | Files | Notes |
|---|---|---|
| Router | `mobile/app/_layout.tsx`, `mobile/app/(tabs)/*`, `mobile/app/(auth)/*`, `mobile/app/product/[id].tsx`, `mobile/app/checkout.tsx` | Expo Router stack, auth group, tab group, product details, checkout modal. |
| State | `mobile/store/sessionStore.ts`, `mobile/store/cartStore.ts` | Zustand stores. |
| Data fetching | `mobile/features/menu/queries.ts`, `mobile/features/concierge/useConcierge.ts`, `mobile/features/checkout/useCheckout.ts` | React Query hooks. |
| API | `mobile/services/apiClient.ts` | Adds `x-request-id`, bearer auth, retry. |
| Observability | `mobile/services/observability.ts` | Sentry React Native with header redaction. |
| UI | `mobile/components/*.tsx`, `mobile/theme/tokens.ts`, `mobile/global.css`, `mobile/tailwind.config.ts` | NativeWind + tokenized components. |
| Build/release | `mobile/eas.json`, `mobile/app.json`, `mobile/deployment.md`, `mobile/app-store-readiness.md` | EAS profiles and governance docs. |

### Integrations

| Integration | Package/files | Required env |
|---|---|---|
| PostgreSQL | Prisma, `@prisma/client`, `prisma/schema.prisma` | `DATABASE_URL` |
| Redis/BullMQ | `ioredis`, `bullmq`, `src/jobs/**`, `src/workers/**` | `REDIS_URL`, optional `REDIS_HOST`, `REDIS_PORT` |
| Sentry server | `@sentry/node`, `src/observability/sentry.ts` | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, sampling vars |
| Sentry mobile | `@sentry/react-native`, `mobile/services/observability.ts` | `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` |
| OpenTelemetry | `@opentelemetry/*`, collector configs | `OTEL_*` |
| Prometheus | `prom-client`, `/metrics` | none required |
| Gemini | `@google/genai`, `server.ts` | `GEMINI_API_KEY` |
| Stripe | `stripe`, `@stripe/*`, `src/services/paymentService.ts` | `STRIPE_SECRET_KEY` |
| Firebase Admin | `firebase-admin`, `src/services/notificationService.ts` | `FIREBASE_SERVICE_ACCOUNT_KEY`, `FIREBASE_PROJECT_ID` |
| Socket.io | `socket.io`, `src/realtime/**` | none required |

## Feature Inventory

| Feature | Purpose | Location | Dependencies | Maturity | Readiness | Priority |
|---|---|---|---|---|---|---|
| Express API Gateway | Central backend API under `/api/v1`. | `server.ts`, `src/api/routes.ts` | Express, zod, middleware | Mature | Production candidate after tests | P0 |
| Health/Readiness/Liveness | Operational probes and diagnostics. | `server.ts`, `src/health/**` | Redis, queues, runtime state | Mature | Production ready with env fixes | P0 |
| Auth/JWT/RBAC | Login, refresh, logout, bearer validation, role guards. | `src/controllers/authController.ts`, `src/services/authService.ts`, `src/middlewares/auth.ts`, `src/utils/jwt.ts` | jsonwebtoken, bcryptjs, Prisma | Medium | Needs stronger validation and tests | P0 |
| Product API | Product list/create/stock update. | `src/controllers/productController.ts`, `src/services/*product*`, `src/api/routes.ts` | Prisma | Medium | Adapt to SALORA catalog | P1 |
| Order API | Create orders and state transitions. | `src/controllers/orderController.ts`, `src/services/orderService.ts` | Prisma, event/queue modules | Medium | Adapt/test transactionality | P1 |
| Prisma Data Model | Users, roles, sessions, audit logs, menu, product, order, theme, AI config, events, health. | `prisma/schema.prisma` | PostgreSQL | Medium | Needs migrations/seeds | P0 |
| Redis Cache/PubSub | Redis client with local mock fallback. | `src/db/redis.ts` | ioredis | Medium | Good dev ergonomics; prod should fail fast | P1 |
| BullMQ Queue Domains | Jobs, AI generation, messaging, analytics, realtime, low-priority, dead-letter. | `src/jobs/bullmqIntegration.ts` | BullMQ, Redis | Mature | Production candidate | P0 |
| Dead Letter Queue | Failed job retention and inspection. | `src/workers/deadLetterQueue.ts`, `test/verify-dlq.ts` | BullMQ | Medium | Needs dashboard linkage | P1 |
| Runtime Supervisor | Monitors runtime/queues and supports control loops. | `src/runtime/supervisor/**` | runtime state, queues | Medium | Needs operational tests | P1 |
| Runtime Controller/Recovery | Queue pressure and recovery orchestration. | `src/runtime/control/**`, `src/runtime/recovery/**` | BullMQ domains | Medium | Adopt incrementally | P1 |
| OpenTelemetry | Traces/metrics export via OTLP. | `src/observability/opentelemetry.ts` | OTel SDK/exporters | Mature | Production ready after collector/exporter target chosen | P0 |
| Sentry Server | Error capture, context sanitation, request tags. | `src/observability/sentry.ts` | `@sentry/node` | Mature | Production ready | P0 |
| Correlation IDs | `x-request-id`, AsyncLocalStorage, span attributes, Sentry context. | `src/observability/correlation.ts` | OTel API, Sentry | Mature | Production ready | P0 |
| Prometheus Metrics | `/metrics` with Node, event loop, heap, queue gauges. | `src/telemetry/prometheus.ts` | prom-client, BullMQ | Mature | Protect endpoint in prod | P0 |
| Security Headers/CSP | Baseline hardening headers. | `src/middlewares/securityHeaders.ts` | Express | Medium | Tighten script/style rules | P0 |
| Rate Limiting | Basic API gateway limiter and Redis-backed diagnostic limiter. | `src/middlewares/rateLimiter.ts`, `src/reliability/rateLimiter.ts` | Express, ioredis | Medium | Replace in-memory global limiter for multi-instance prod | P0 |
| Gemini Executive Assistant | Chat endpoint with SALORA system prompt. | `server.ts` | `@google/genai`, zod | Medium | Validate model and secrets | P1 |
| AI Content Studio | Copywriting endpoint. | `server.ts` | Gemini | Medium | Adapt prompts and moderation | P1 |
| AI Visual Hub | Prompt/spec generator returning JSON. | `server.ts` | Gemini | Medium | Harden JSON parse failure handling | P1 |
| Provider-Agnostic AI SDK | Unified interface to OpenAI/Gemini/Claude/Ollama. | `src/sdk/ai/**`, `src/ai/providers/**` | Provider SDKs/env | Early/Medium | Needs concrete tests | P2 |
| AI Gateway/Fallback | Provider routing, fallback, cost optimizer. | `src/ai/gateway/**` | AI provider modules | Medium | Migrate after target provider strategy | P2 |
| AI Security | Prompt protection, context filtering, abuse detection, AI rate limiting. | `src/security/ai/**` | local modules | Medium | Recommended before public AI endpoints | P1 |
| Realtime | Socket.io, presence, live recommendations/events. | `src/realtime/**` | Socket.io | Medium | P1 if real-time UX required | P1 |
| Design System | Tokens, components, standards, Storybook. | `design-system/**`, `.storybook/**` | React, Storybook | Medium/Mature | Good reference; adapt styles | P1 |
| Design Validation | Token and hardcoded-value validators. | `src/design-system/validation/**` | local TS | Medium | Useful for governance | P2 |
| UX Analytics | Heatmaps, attention, scroll, rage-click, interaction tracking. | `src/analytics/ux/**` | local TS | Early | Optional | P3 |
| Deployment Governance | Checklists, rollback, release validation, secrets docs. | `deployment/**` | GitHub/ops | Mature docs | Copy as reference | P1 |
| CI/CD | Lint/build/test/audit/release/mobile workflows. | `.github/workflows/**` | GitHub Actions, pnpm | Mature | Production candidate | P0 |
| Expo Mobile | Auth/tabs/menu/cart/concierge/checkout app. | `mobile/**` | Expo, RN, React Query, Zustand, NativeWind, Sentry | Medium | Good foundation | P1 |
| Mobile Request IDs | Correlated mobile API requests. | `mobile/services/apiClient.ts`, `mobile/utils/requestId.ts` | fetch, Zustand | Mature | Production ready | P1 |
| Mobile EAS | Build/submit profiles. | `mobile/eas.json` | EAS CLI | Medium | Adapt bundle IDs/secrets | P1 |

## Observability Inventory

### OpenTelemetry

Files:

| File | Purpose |
|---|---|
| `src/observability/opentelemetry.ts` | Creates NodeSDK, resource attributes, OTLP trace exporter, OTLP metric exporter, metric reader, auto-instrumentations. |
| `src/telemetry/otel-bootstrap.ts` | Re-exports OTel init/status/shutdown under telemetry naming. |
| `src/observability/resource.ts` | Resource helper for service metadata. |
| `otel-collector-config.yml`, `observability/otel-collector-config.yml` | Local collector receiving OTLP gRPC/HTTP and logging traces/metrics. |
| `k8s/otel-collector.yaml` | Kubernetes collector deployment/config. |

Packages:

```text
@opentelemetry/api
@opentelemetry/sdk-node
@opentelemetry/resources
@opentelemetry/semantic-conventions
@opentelemetry/sdk-trace-node
@opentelemetry/sdk-metrics
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/exporter-metrics-otlp-http
@opentelemetry/instrumentation
@opentelemetry/instrumentation-http
@opentelemetry/instrumentation-fastify
@opentelemetry/auto-instrumentations-node
```

Environment variables:

| Variable | Required | Notes |
|---|---|---|
| `OTEL_SERVICE_NAME` | Recommended | Defaults to `salora`. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Production only/recommended | Base endpoint; code appends `/v1/traces` and `/v1/metrics`. |
| `OTEL_TRACES_ENDPOINT` | Optional | Overrides trace endpoint. |
| `OTEL_METRICS_ENDPOINT` | Optional | Overrides metric endpoint. |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional/production | Comma-separated key-value headers. |
| `OTEL_RESOURCE_ATTRIBUTES` | Recommended | Example: `deployment.environment=production,service.namespace=salora`. |
| `OTEL_DEBUG` | Development only | Enables OTel diagnostic console logger. |

Migration instruction: initialize OTel before route handling and background worker startup. SALORA should decide whether telemetry startup failure is fatal. DEV records outage but continues.

### Sentry

Files:

| File | Purpose |
|---|---|
| `src/observability/sentry.ts` | Server Sentry init, request context, sanitizer, capture helper. |
| `src/observability/correlation.ts` | Sends request ID to Sentry scope. |
| `src/telemetry/sentry-init.ts` | Additional/legacy Sentry init surface. |
| `src/monitoring/sentry.ts` | Monitoring namespace Sentry integration. |
| `mobile/services/observability.ts` | Sentry React Native init and mobile header redaction. |

Package:

```text
@sentry/node
@sentry/react-native
```

Environment variables:

| Variable | Required | Notes |
|---|---|---|
| `SENTRY_DSN` | Production recommended | Empty disables server Sentry. |
| `SENTRY_ENVIRONMENT` | Recommended | `development`, `staging`, `production`, `ci`. |
| `SENTRY_RELEASE` | Production recommended | Use commit SHA/release version. |
| `RELEASE_VERSION` | Optional | Fallback release identifier. |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional | Defaults to `0.1`. |
| `SENTRY_PROFILES_SAMPLE_RATE` | Optional | Defaults to `0.0`. |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile production recommended | Empty disables mobile Sentry. |
| `EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Mobile optional | Defaults to `0.1`. |

Redaction: server sanitizer redacts keys matching authorization, cookie, token, secret, password, key, dsn, payment, card; truncates long strings and arrays. Mobile `beforeSend` deletes authorization and cookie headers.

### Request Correlation IDs

Files:

| File | Purpose |
|---|---|
| `src/observability/correlation.ts` | AsyncLocalStorage request context, `x-request-id`, span attributes, Sentry context, error handler. |
| `server.ts` | Mounts `correlationMiddleware` before request logger and API routes. |
| `mobile/services/apiClient.ts` | Generates and sends `x-request-id` for mobile requests. |
| `mobile/utils/requestId.ts` | Request ID generator. |

Migration instruction: mount correlation before logging, auth, and route middleware. Preserve `x-request-id` echo behavior so clients can report failed request IDs.

### Prometheus and Metrics

Files:

| File | Purpose |
|---|---|
| `src/telemetry/prometheus.ts` | `prom-client` default metrics, event loop/heap gauges, queue gauges, `/metrics` endpoint. |
| `src/utils/monitoring.ts` | Event loop and heap metric source. |
| `grafana/dashboards/queue-overview.json` | Dashboard reference. |

Package:

```text
prom-client
```

Metric names:

```text
salora_eventloop_p50_ms
salora_eventloop_p90_ms
salora_heap_used_bytes
salora_queue_waiting
salora_queue_active
salora_queue_delayed
salora_queue_completed
salora_queue_failed
```

Migration instruction: in production, protect `/metrics` by network policy, ingress allowlist, or auth proxy. Do not expose metrics publicly.

### Logging and Tracing

Files:

| File | Purpose |
|---|---|
| `src/logging/logger.ts` | Pino logger with `pino-pretty` in non-prod. |
| `src/middlewares/logger.ts` | Request logging middleware. |
| `src/observability/tracing.ts` | Tracing helper surface. |
| `src/monitoring/*` | Runtime context, performance metrics, AI metrics, error fingerprinting, dashboard. |

Environment variables:

| Variable | Required | Notes |
|---|---|---|
| `LOG_LEVEL` | Optional | Defaults to `info`. |
| `NODE_ENV` | Required | Controls pretty logging and runtime behavior. |

## Security Inventory

### Middleware

| Middleware | File | Purpose | Migration note |
|---|---|---|---|
| Security headers | `src/middlewares/securityHeaders.ts` | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. | Migrate P0; tighten CSP for production. |
| Rate limiter | `src/middlewares/rateLimiter.ts` | In-memory IP limiter: 120 requests/minute. | Replace/adapt for distributed deployment. |
| Redis rate limiter | `src/reliability/rateLimiter.ts` | Used on diagnostic mutation endpoints. | Prefer this style for multi-instance. |
| JWT authentication | `src/middlewares/auth.ts` | Bearer token verification. | Migrate P0; sanitize errors. |
| RBAC | `src/middlewares/auth.ts` `requireRole` | OWNER/ADMIN/STAFF route restrictions. | Migrate P0; normalize role casing. |
| Request logger | `src/middlewares/logger.ts` | API request logging. | Use with correlation ID. |

### CSP

Current CSP:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
img-src 'self' data: blob:;
font-src 'self' https://fonts.gstatic.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
script-src 'self' 'unsafe-inline';
connect-src 'self' https://*.sentry.io
```

Production recommendation: remove `script-src 'unsafe-inline'` if the final frontend build supports nonce/hash-based scripts. Add explicit API, websocket, OTel, and Sentry ingest domains as needed.

### Validation

| Validation point | Files | Notes |
|---|---|---|
| Env config | `src/config/index.ts`, `src/core/envValidator.ts` | Zod validation; two schemas currently overlap and should be unified. |
| Gemini payloads | `server.ts` | Zod schemas for chat/content/visual body size and shape. |
| Auth controller | `src/controllers/authController.ts` | Basic required field checks. |
| Order controller | `src/controllers/orderController.ts` | Items array and status enum checks. |
| Mobile auth schema | `mobile/features/auth/schema.ts` | Zod client validation. |

### Authentication and Authorization

Auth uses bcryptjs, jsonwebtoken, Prisma sessions, refresh tokens, and roles. Production requires:

```text
JWT_SECRET
JWT_REFRESH_SECRET
```

Migration requirements:

1. Use at least 32-byte high-entropy JWT secrets.
2. Ensure refresh token storage and rotation semantics match SALORA policy.
3. Add auth tests for expired tokens, malformed bearer headers, role mismatch, refresh reuse, logout revocation.
4. Avoid returning raw error messages from JWT verification to clients in production.

### Secret Handling

Secret-bearing env vars:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
GEMINI_API_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
FIREBASE_SERVICE_ACCOUNT_KEY
FIREBASE_PROJECT_ID
SENTRY_DSN
OTEL_EXPORTER_OTLP_HEADERS
EXPO_PUBLIC_SENTRY_DSN
```

Migration instruction: public Expo variables are visible to clients. Never put private API keys in `EXPO_PUBLIC_*`.

### Sanitization and Redaction

| File | Behavior |
|---|---|
| `src/observability/sentry.ts` | Redacts sensitive context keys, truncates values, limits nested depth. |
| `mobile/services/observability.ts` | Removes authorization/cookie headers from Sentry events. |
| `src/observability/correlation.ts` | Uses sanitized context before Sentry capture. |

## CI/CD Inventory

Workflow files:

| File | Trigger | Gates |
|---|---|---|
| `.github/workflows/ci.yml` | Push to `main`, `develop`, `release/**`, `hotfix/**`; PR to `main`, `develop`, `release/**` | Redis service, pnpm install, Prisma generate, typecheck via `pnpm lint`, build, Jest, artifact upload. |
| `.github/workflows/quality-gates.yml` | PR to `main`, `develop`, `release/**` | Redis service, install, Prisma generate, TypeScript gate, test gate, build gate, critical `pnpm audit`. |
| `.github/workflows/release-validation.yml` | Manual, push to `main`, `release/**`, tags `v*.*.*` | Install, Prisma generate, lint, test, build, start server, staging health checks, upload logs. |
| `.github/workflows/mobile-ci.yml` | Mobile path changes on PR/push | Install, mobile typecheck, mobile lint, Expo web export validation. |

Quality gates:

```text
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm lint
pnpm build
pnpm test -- --runInBand
pnpm audit --audit-level critical
pnpm verify:staging
pnpm --filter @salora/mobile typecheck
pnpm --filter @salora/mobile lint
pnpm --filter @salora/mobile build:validate
```

CI/CD migration notes:

1. Align Node version with `package.json`: use Node 22 everywhere.
2. Add PostgreSQL service if tests require real Prisma DB operations; current workflows only define Redis while `DATABASE_URL` points to localhost PostgreSQL.
3. Keep Sentry and OTel disabled in CI unless explicitly validating exporters.
4. Preserve artifact upload for `dist/` and release logs.
5. Add branch protection requiring CI, quality gates, release validation for release branches, and mobile validation for mobile changes.

## Mobile Inventory

Mobile exists and is substantial.

### Expo Structure

| File/path | Purpose |
|---|---|
| `mobile/package.json` | Expo app package, scripts, dependencies. |
| `mobile/app.json` | Expo config. |
| `mobile/app/_layout.tsx` | Root providers: React Query, GestureHandler, SafeArea, Sentry init, session hydration, Stack. |
| `mobile/app/(auth)/*` | Login, register, forgot-password routes. |
| `mobile/app/(tabs)/*` | Home, menu, cart, concierge, profile tabs. |
| `mobile/app/product/[id].tsx` | Product detail dynamic route. |
| `mobile/app/checkout.tsx` | Checkout modal route. |
| `mobile/components/*` | Button, ProductCard, Screen, SectionHeader, TextField. |
| `mobile/features/*` | Auth schema, checkout hook, concierge hook, menu queries. |
| `mobile/services/*` | API client, auth/menu/notification services, AI concierge, observability. |
| `mobile/store/*` | Zustand session/cart stores. |
| `mobile/theme/tokens.ts` | Mobile token system. |
| `mobile/tailwind.config.ts`, `mobile/global.css`, `mobile/nativewind-env.d.ts` | NativeWind setup. |
| `mobile/eas.json` | EAS development/preview/production profiles. |

### Expo Router

Root layout declares stack entries for:

```text
index
(auth)
(tabs)
checkout modal
```

Migration instruction: preserve route groups and modal presentation. Update package/bundle identifiers in `app.json` before EAS production builds.

### Zustand

Stores:

```text
mobile/store/sessionStore.ts
mobile/store/cartStore.ts
```

Migration instruction: keep mobile client state in Zustand and server state in React Query. Avoid merging root Redux-style files into the mobile workspace unless SALORA has already standardized on Redux.

### React Query

Root `QueryClientProvider` is in `mobile/app/_layout.tsx`. Default retry is 2 for queries and 1 for mutations, with 60-second stale time.

Migration instruction: preserve API retry boundaries and add query invalidation around checkout/order mutation flows.

### NativeWind

Files:

```text
mobile/tailwind.config.ts
mobile/global.css
mobile/babel.config.js
mobile/metro.config.js
mobile/nativewind-env.d.ts
```

Migration instruction: copy the full NativeWind setup as a unit; partial migration often breaks className transform.

### Sentry Mobile

Files:

```text
mobile/services/observability.ts
mobile/app/_layout.tsx
```

Environment:

```text
EXPO_PUBLIC_ENVIRONMENT
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
```

### EAS

`mobile/eas.json` defines:

| Profile | Use |
|---|---|
| `development` | Development client, internal distribution, development channel. |
| `preview` | Internal staging channel. |
| `production` | Production channel with auto-increment. |

Mobile migration steps:

1. Copy `mobile/` into SALORA only after root workspace and pnpm are stable.
2. Update `mobile/app.json` identifiers, name, scheme, icons, splash, runtime version, and update channel policy.
3. Copy `.env.example` values into target env management.
4. Run `pnpm --filter @salora/mobile typecheck`.
5. Run `pnpm --filter @salora/mobile lint`.
6. Run `pnpm --filter @salora/mobile build:validate`.
7. Configure Sentry React Native release/upload only after EAS credentials exist.

## Package Inventory

### Root Dependencies Added

| Package | Version | Reason | Necessity |
|---|---:|---|---|
| `@google/genai` | latest | Gemini AI endpoints. | Recommended if Gemini remains provider. |
| `@prisma/client` | ^5.21.1 | PostgreSQL ORM client. | Required if Prisma retained. |
| `@stripe/react-stripe-js` | ^2.7.1 | Web Stripe UI integration. | Optional unless web payments. |
| `@stripe/stripe-js` | ^3.0.0 | Stripe browser SDK. | Optional unless web payments. |
| `axios` | ^1.7.2 | HTTP client utility. | Optional. |
| `bcryptjs` | ^3.0.3 | Password hashing. | Required for local auth. |
| `clsx` | ^2.1.0 | CSS class composition. | Recommended for React UI. |
| `cors` | ^2.8.5 | CORS middleware. | Required if cross-origin clients. |
| `dotenv` | ^17.4.2 | Env loading. | Required for local/dev. |
| `express` | ^4.19.2 | Backend HTTP server. | Required. |
| `express-rate-limit` | ^7.1.5 | Rate limiting package. | Recommended; DEV also has custom limiter. |
| `firebase-admin` | ^12.0.0 | Server push notifications/admin SDK. | Optional unless Firebase notifications. |
| `ioredis` | ^5.10.1 | Redis client. | Required for BullMQ/realtime rate limits. |
| `bullmq` | ^4.18.3 | Job queues. | Required for runtime jobs. |
| `@opentelemetry/*` | listed above | Traces/metrics. | Required for observability target. |
| `@sentry/node` | ^7.40.0 | Server error tracking. | Recommended/production. |
| `pino` | ^8.20.0 | Structured logging. | Required. |
| `pino-pretty` | ^9.0.0 | Dev log readability. | Development only. |
| `@bull-board/api` | ^7.1.5 | Queue dashboard API. | Recommended/admin only. |
| `@bull-board/express` | ^7.1.5 | Queue dashboard Express adapter. | Recommended/admin only. |
| `zod` | ^3.23.0 | Validation. | Required. |
| `jsonwebtoken` | ^9.0.3 | JWT auth. | Required if JWT retained. |
| `lucide-react` | ^0.435.0 | UI icons. | Recommended. |
| `react` | ^18.3.1 | Web UI. | Required. |
| `react-dom` | ^18.3.1 | Web UI DOM rendering. | Required. |
| `react-router-dom` | ^6.21.0 | Client routing. | Required if current web routing retained. |
| `recharts` | ^2.12.7 | Analytics charts. | Optional/recommended for dashboards. |
| `socket.io` | ^4.8.3 | Realtime server. | Recommended if realtime retained. |
| `stripe` | ^16.12.0 | Server payments. | Optional unless payments. |
| `swagger-ui-express` | ^5.0.0 | API docs UI. | Optional/recommended. |
| `ws` | ^8.18.0 | WebSocket utility. | Optional. |
| `zustand` | ^4.4.7 | State management. | Recommended if stores retained. |
| `prom-client` | ^14.0.0 | Prometheus metrics. | Required for `/metrics`. |

### Root Dev Dependencies Added

| Package | Version | Reason | Necessity |
|---|---:|---|---|
| `@tailwindcss/vite` | ^4.0.0-alpha.25 | Tailwind/Vite integration. | Optional; alpha risk. |
| `@testing-library/react` | ^14.1.2 | React tests. | Recommended. |
| `@testing-library/jest-dom` | ^6.1.5 | DOM assertions. | Recommended. |
| `@types/*` | various | TypeScript typings. | Required for TS quality. |
| `@vitejs/plugin-react` | ^4.3.1 | Vite React build. | Required. |
| `cypress` | ^13.6.2 | E2E tests. | Recommended. |
| `esbuild` | ^0.28.0 | Server bundling. | Required for current build. |
| `jest` | ^29.7.0 | Unit tests. | Required for current CI. |
| `jest-environment-jsdom` | ^29.7.0 | React test env. | Recommended. |
| `prisma` | ^5.21.1 | Prisma CLI. | Required if Prisma retained. |
| `supertest` | ^6.3.3 | HTTP API tests. | Recommended. |
| `tailwindcss` | ^4.0.0-alpha.25 | Styling. | Optional; alpha risk. |
| `ts-jest` | ^29.1.1 | Jest TS transform. | Required for current tests. |
| `ts-node` | ^10.9.2 | TS execution. | Optional. |
| `tsx` | ^4.22.3 | TS runtime for dev. | Required for `pnpm dev`. |
| `typescript` | ^5.5.2 | TypeScript compiler. | Required. |
| `vite` | ^5.3.1 | Web build/dev. | Required. |
| `vitest` | ^1.1.0 | Alternate test runner. | Optional unless used. |
| `@storybook/react` | ^7.0.0 | Storybook. | Optional/recommended for design system. |
| `@storybook/react-vite` | ^7.0.0 | Storybook Vite builder. | Optional. |
| `@storybook/addon-essentials` | ^7.0.0 | Storybook addon pack. | Optional. |

### Mobile Dependencies Added

| Package | Version | Reason | Necessity |
|---|---:|---|---|
| `expo` | ~56.0.0 | Expo runtime. | Required. |
| `expo-router` | ~56.2.0 | File-based routing. | Required. |
| `react-native` | 0.85.0 | Native app runtime. | Required. |
| `react`, `react-dom` | 19.2.3 | React runtime/web export. | Required. |
| `@tanstack/react-query` | ^5.85.0 | Server state/cache. | Required/recommended. |
| `zustand` | ^4.5.5 | Client state. | Required if current stores retained. |
| `nativewind` | ^4.1.23 | Tailwind-style RN styling. | Recommended. |
| `@sentry/react-native` | ^6.20.0 | Mobile observability. | Production recommended. |
| `expo-secure-store` | ~56.0.0 | Secure token storage. | Required for auth. |
| `expo-notifications` | ~56.0.0 | Push notifications. | Optional/recommended. |
| `expo-updates` | ~56.0.0 | OTA updates. | Recommended. |
| `react-hook-form`, `@hookform/resolvers`, `zod` | listed | Form validation. | Recommended. |
| `react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context` | listed | Navigation/gesture primitives. | Required for Expo Router UX. |

## Environment Inventory

```env
# Core
NODE_ENV=
PORT=
JSON_BODY_LIMIT=
LOG_LEVEL=
RELEASE_VERSION=

# Database
DATABASE_URL=

# Redis / BullMQ
REDIS_URL=
REDIS_HOST=
REDIS_PORT=
REDIS_CONNECT_TIMEOUT_MS=
REDIS_MAX_RETRIES_PER_REQUEST=
BULL_QUEUE_NAME=
BULL_CONCURRENCY=
DEAD_LETTER_QUEUE_NAME=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=

# AI
GEMINI_API_KEY=
OPENAI_API_KEY=

# Payments
STRIPE_SECRET_KEY=

# Notifications
FIREBASE_SERVICE_ACCOUNT_KEY=
FIREBASE_PROJECT_ID=

# OpenTelemetry
OTEL_SERVICE_NAME=
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_TRACES_ENDPOINT=
OTEL_METRICS_ENDPOINT=
OTEL_EXPORTER_OTLP_HEADERS=
OTEL_RESOURCE_ATTRIBUTES=
OTEL_DEBUG=

# Sentry server
SENTRY_DSN=
SENTRY_ENVIRONMENT=
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=
SENTRY_PROFILES_SAMPLE_RATE=

# Streaming/runtime
STREAM_SESSION_IDLE_MS=
CONFIG_CHECKSUM=

# Web client
REACT_APP_API_URL=

# Mobile public
EXPO_PUBLIC_ENVIRONMENT=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=

# CI/verification
BASE_URL=
TIMEOUT_MS=
```

| Variable | Classification | Notes |
|---|---|---|
| `NODE_ENV` | Required | `development`, `test`, `staging` in validator, `production`; schemas should be unified. |
| `PORT` | Required/recommended | Defaults to 3000 in config/server. |
| `JSON_BODY_LIMIT` | Optional | Defaults to `1mb`. |
| `LOG_LEVEL` | Optional | Defaults to `info`. |
| `RELEASE_VERSION` | Production only | Sentry release fallback. |
| `DATABASE_URL` | Required production | Prisma PostgreSQL URL. DEV falls back locally in config, but production should require it. |
| `REDIS_URL` | Required production | Queues require Redis. |
| `REDIS_HOST`, `REDIS_PORT` | Optional/dev-compose | Used only if `REDIS_URL` absent in BullMQ integration. |
| `REDIS_CONNECT_TIMEOUT_MS`, `REDIS_MAX_RETRIES_PER_REQUEST` | Optional | Runtime singleton tuning. |
| `BULL_QUEUE_NAME` | Optional | Defaults to `salora-jobs`. |
| `BULL_CONCURRENCY` | Optional | Defaults to 5 in multiple places. |
| `DEAD_LETTER_QUEUE_NAME` | Optional | Defaults to `dead-letter`. |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Required production | Min 32 chars in config. |
| `GEMINI_API_KEY` | Required for Gemini endpoints | Lazy failure if absent. |
| `OPENAI_API_KEY` | Optional/recommended | Present in env template for provider layer. |
| `STRIPE_SECRET_KEY` | Required if payments enabled | Server secret only. |
| `FIREBASE_SERVICE_ACCOUNT_KEY`, `FIREBASE_PROJECT_ID` | Required if notifications enabled | Do not expose client-side. |
| `OTEL_*` | Optional/production recommended | Controls trace/metric export. |
| `SENTRY_*` | Optional/production recommended | Empty DSN disables Sentry. |
| `STREAM_SESSION_IDLE_MS` | Optional | Defaults to 60000. |
| `CONFIG_CHECKSUM` | Internal/generated | Set during kernel bootstrap. |
| `REACT_APP_API_URL` | Optional/development | Used by `src/utils/api.ts`. |
| `EXPO_PUBLIC_*` | Mobile required/recommended | Public mobile config only. |
| `BASE_URL`, `TIMEOUT_MS` | CI/dev only | Staging verification scripts. |

## File-by-File Migration Plan

Because the current DEV repository has no tracked baseline, the following classifies the full file set by path. Treat each row as applying to all files under the specified path unless a specific file is listed.

| Path/file | Reason modified/exists in DEV | Purpose | Recommendation |
|---|---|---|---|
| `.env.example` | Env template | Documents required local/server vars. | Copy directly, then adapt values. |
| `mobile/.env.example` | Mobile env template | Documents Expo public vars. | Copy directly, then adapt values. |
| `.node-version`, `.nvmrc` | Runtime pin | Node version governance. | Copy directly; ensure Node 22. |
| `.npmrc` | Package manager config | pnpm/npm behavior. | Adapt. |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Root workspace and dependencies | Build/test/runtime scripts and workspace layout. | Adapt; do not overwrite target blindly. |
| `mobile/package.json` | Mobile package dependencies | Expo scripts and dependency set. | Adapt with mobile workspace. |
| `tsconfig.json`, `jest.config.ts`, `vite.config.ts` | Type/build/test config | Root TS, Jest, Vite. | Adapt. |
| `server.ts` | Main backend/frontend server | API, health, Gemini endpoints, runtime bootstrap, metrics. | Reimplement/adapt carefully. |
| `index.html`, `src/main.tsx`, `src/App.tsx`, `src/CustomerApp.tsx`, `src/index.css` | Web shell | Vite React app. | Adapt. |
| `src/api/**` | API routers/tests | `/api/v1` contracts, diagnostics, admin queues. | Adapt. |
| `src/controllers/**` | Request controllers | Auth/orders/products/system/diagnostics. | Adapt. |
| `src/services/**` | Business services | Auth, order, loyalty, notifications, payment, theme, AI. | Adapt to target domain. |
| `src/models/**`, `src/contracts/**`, `src/types.ts` | Type contracts | Shared backend type boundaries. | Adapt. |
| `prisma/schema.prisma` | Database schema | Users, roles, sessions, products, orders, events, health. | Adapt/reimplement with migration files. |
| `src/db/**` | Database/cache clients | Prisma and Redis connection. | Adapt. |
| `src/config/**`, `src/core/**` | Runtime foundation | Env, lifecycle, logger, queue, shutdown, telemetry. | Copy/adapt P0. |
| `src/kernel/**` | Bootstrap orchestration | Startup ordering/readiness/checksum. | Adapt. |
| `src/runtime/**` | Runtime control plane | State, supervisor, recovery, queue pressure, streaming runtime. | Adapt incrementally. |
| `src/jobs/**`, `src/workers/**`, `test/verify-*.ts`, `test/stress-harness.ts` | Queue/job system | BullMQ workers, DLQ, verification. | Adapt. |
| `src/reliability/**` | Rate limiter/circuit breaker | Reliability primitives. | Adapt. |
| `src/observability/**`, `src/telemetry/**`, `src/monitoring/**`, `src/logging/**` | Observability | OTel, Sentry, Prometheus, runtime metrics, Pino. | Copy/adapt P0. |
| `src/middlewares/**`, `src/security/**` | Security middleware and AI safety | CSP, JWT, rate limit, prompt protection. | Copy/adapt P0/P1. |
| `src/realtime/**`, `src/streaming/**` | Realtime and streaming | Socket.io, presence, live events, heartbeats. | Adapt if needed. |
| `src/events/**` | Event bus and handlers | Event-driven backend hooks. | Adapt. |
| `src/health/**`, `src/diagnostics/**` | Health and diagnostic handlers | Operational introspection. | Copy/adapt. |
| `src/ai/**`, `src/sdk/ai/**`, `src/store/ai/**` | AI system | Provider SDK, gateway, agents, memory, personalization, generation. | Adapt selectively; do not bulk copy into prod path without tests. |
| `src/analytics/**` | UX analytics | Heatmap, attention, rage click, scroll. | Optional/reimplement. |
| `src/components/**` | Web command-center UI | Admin/AI panels. | Adapt. |
| `design-system/**`, `src/design-system/**`, `.storybook/**` | Design system/governance | Tokens, components, validation, stories. | Adapt P1/P2. |
| `animations/**` | UI animation helpers | Motion primitives. | Optional/adapt. |
| `screens/**` | Modular HomeScreen sample | Screen architecture pattern. | Adapt if matching target frontend. |
| root `*Screen.tsx`, `RootNavigator.tsx`, `AppNavigator.tsx`, `AuthNavigator.tsx` | Legacy mobile/web screen assets | Auth/cart/menu/checkout/product screens. | Skip or adapt after deciding target UI architecture. |
| root `*Slice.ts`, `app-store.ts`, `use*.ts` | Legacy state layer | Redux-style slices/hooks. | Skip/adapt; avoid conflicting with Zustand/mobile state. |
| `mobile/**` | Expo app | Mobile platform. | Copy/adapt as a unit. |
| `.github/**` | GitHub governance/CI | Workflows, CODEOWNERS, templates. | Copy/adapt. |
| `deployment/**` | Release/ops docs | Checklists and governance. | Copy as reference; adapt names/secrets. |
| `Dockerfile` | Container build | Production image. | Adapt; fix Node 22. |
| `docker-compose.yml` | Local infra | Redis, OTel collector, app. | Adapt; fix app build/runtime paths. |
| `k8s/**`, `k8s-deployment.yaml` | Kubernetes manifests | App, service, Redis, OTel collector. | Adapt; externalize secrets and image refs. |
| `otel-collector-config.yml`, `observability/otel-collector-config.yml` | OTel collector config | Local collector pipelines. | Copy/adapt exporter destinations. |
| `grafana/**` | Dashboard | Queue metrics dashboard. | Adapt datasource/metrics. |
| `scripts/**` | Setup, verification, worker, stress scripts | Operational tooling. | Adapt path/env assumptions. |
| `tests/**`, `src/tests/**` | Core/visual test setup | Infrastructure and visual regression. | Adapt. |
| `*.md` root docs | Project knowledge corpus | Architecture, AI, setup, phase reports, guides. | Copy as reference docs; do not treat as implementation. |
| `.continue/**` | AI assistant rules | Local agent behavior docs. | Skip unless SALORA uses same agent tooling. |
| `.build-outputs/**`, `dist/**`, `mobile/dist-mobile/**`, `.expo/**`, `node_modules/**`, `.pnpm-*`, install logs | Generated artifacts/cache | Build outputs and dependency caches. | Skip. |

## Knowledge Transfer: Lessons Learned

### Environment Fixes

1. The project expects Node 22 and pnpm 8.8.0. Keep this consistent across local, CI, Docker, and deployment.
2. Two env validation systems exist: `src/config/index.ts` and `src/core/envValidator.ts`. SALORA should unify them to avoid staging/production enum mismatches.
3. Production must require `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`. DEV has helpful local fallbacks that should not silently mask production misconfiguration.

### Node Issues

1. `package.json` engines require `node >=22 <23`.
2. `Dockerfile` currently uses `node:20-bullseye`; update to Node 22 before using it.
3. CI already uses Node 22.

### pnpm Issues

1. The lockfile and workspace should be migrated together.
2. Use `pnpm install --frozen-lockfile` in CI.
3. Mobile is a workspace package and should be validated through `pnpm --filter @salora/mobile ...`.
4. Keep `pnpm@8.8.0` pinned unless SALORA intentionally upgrades and refreshes lockfile.

### OpenTelemetry Lessons

1. Use `OTEL_EXPORTER_OTLP_ENDPOINT` for collector base URL when both traces and metrics go to the same collector.
2. Keep `OTEL_TRACES_ENDPOINT` and `OTEL_METRICS_ENDPOINT` available for explicit overrides.
3. Add resource attributes for deployment environment and service namespace.
4. Decide if telemetry init failure is non-fatal. DEV continues running and emits telemetry outage events.

### Sentry Lessons

1. Empty DSN should disable Sentry cleanly.
2. Redaction must happen before context reaches Sentry.
3. Set release to commit SHA in CI/release workflows.
4. Mobile DSN is public; never include private server secrets in Expo public env.

### Expo Lessons

1. Copy NativeWind, Babel, Metro, global CSS, and env type files together.
2. Keep React Query for server state and Zustand for local session/cart state.
3. Add `x-request-id` on every mobile API request for backend correlation.
4. Run mobile export validation before any EAS production build.

### CI/CD Lessons

1. Redis service is included; PostgreSQL service is not. Add Postgres if tests hit Prisma.
2. `pnpm audit --audit-level critical` is a useful PR gate but can become noisy; define emergency override policy.
3. Release validation should start the built app and hit `/api/ready`, `/api/live`, `/api/health`, and `/metrics` when allowed.

### Performance Optimizations

1. Event loop and heap monitoring are already available through `src/utils/monitoring.ts`.
2. BullMQ queue pressure analysis can be used to tune concurrency.
3. Use readiness gates to remove overloaded instances before failures become customer-facing.
4. Prefer Redis-backed rate limiting for multi-instance deployments.

### Security Hardening

1. Replace or supplement in-memory rate limiting before horizontal scaling.
2. Tighten CSP in production and remove inline script allowance if possible.
3. Protect `/metrics`, diagnostics mutations, Bull Board, and runtime inspect endpoints.
4. Keep auth/RBAC middleware in front of queue admin routes.
5. Redact secrets in logs, Sentry, and diagnostic responses.

## Target Implementation Roadmap

### Phase 1: Foundation

1. Establish Node 22 + pnpm 8.8.0 in SALORA.
2. Merge workspace layout only if SALORA needs mobile.
3. Adapt `package.json` scripts and dependencies.
4. Add unified env schema and `.env.example`.
5. Add Prisma schema/migrations or map DEV schema to SALORA existing schema.
6. Confirm `pnpm lint`, `pnpm build`, and basic tests pass.

### Phase 2: Runtime & Observability

1. Migrate Pino logger and request logger.
2. Add correlation middleware and `x-request-id` response behavior.
3. Add Sentry server init and sanitizer.
4. Add OpenTelemetry NodeSDK and collector config.
5. Add Prometheus `/metrics` with queue/event loop/heap gauges.
6. Add `/api/health`, `/api/ready`, `/api/live`.
7. Add runtime state and graceful shutdown.

### Phase 3: Security

1. Add security headers/CSP.
2. Add JWT auth and RBAC guards.
3. Add distributed rate limiting.
4. Add AI prompt protection before public AI endpoints.
5. Protect diagnostics, queue admin, metrics, and runtime inspect endpoints.
6. Add auth/security tests.

### Phase 4: Performance

1. Add Redis/BullMQ queue domains.
2. Add queue pressure analyzer and runtime controller.
3. Add worker retry/backoff policies and DLQ.
4. Add stress scripts and queue verification.
5. Tune concurrency per workload.

### Phase 5: CI/CD

1. Copy/adapt GitHub Actions.
2. Add Redis and PostgreSQL services.
3. Enforce frozen lockfile, Prisma generate, typecheck, test, build.
4. Add critical audit gate.
5. Add release validation workflow with health checks.
6. Add artifact/log uploads.

### Phase 6: Mobile Platform

1. Copy/adapt `mobile/` as a single workspace.
2. Update Expo app identifiers and branding.
3. Configure Expo public env.
4. Validate NativeWind and routing.
5. Wire mobile auth/API to SALORA backend.
6. Add mobile CI and EAS profiles.

### Phase 7: Production Hardening

1. Fix Docker Node version and production image.
2. Externalize secrets in Kubernetes.
3. Add network policies for metrics and diagnostics.
4. Add SLO dashboards and alerts.
5. Add Sentry release and source map handling.
6. Add backup/restore and migration rollback procedures.

### Phase 8: Launch Readiness

1. Run full CI, release validation, mobile validation, stress tests.
2. Verify `/api/ready` and `/api/live` under Redis/DB outage simulations.
3. Validate Sentry, OTel, Prometheus, and Grafana in staging.
4. Perform security review of CSP, auth, secrets, diagnostics.
5. Freeze package versions and tag release candidate.
6. Execute deployment checklist and rollback drill.

## Final Executive Report

### Scores

| Category | Score | Rationale |
|---|---:|---|
| Architecture Score | 8/10 | Strong layered architecture and runtime ambition, but fragmented frontend/root screen assets need consolidation. |
| Security Score | 7/10 | Good headers, JWT/RBAC, redaction, and rate limiting; production needs distributed limiter, tighter CSP, endpoint protection, auth tests. |
| Performance Score | 7/10 | Queue domains, event loop metrics, heap metrics, and recovery patterns exist; needs load testing and concurrency calibration. |
| Observability Score | 9/10 | OTel, Sentry, Prometheus, correlation IDs, diagnostics, and dashboards are present. Protect metrics and unify init paths. |
| Mobile Score | 8/10 | Modern Expo Router architecture with Zustand, React Query, NativeWind, Sentry, EAS; needs target branding and store/API validation. |
| CI/CD Score | 8/10 | Solid workflows and gates; add PostgreSQL service and fix Docker Node mismatch. |
| Production Readiness Score | 7/10 | Strong foundation, but requires env unification, deployment secret hardening, Docker fix, tests, and endpoint protection. |

### What MUST Be Migrated

```text
Node 22/pnpm foundation
Env schema and env templates
Express API route structure
Health/readiness/liveness endpoints
Correlation ID middleware
Sentry sanitizer/capture
OpenTelemetry bootstrap
Prometheus metrics endpoint
Pino logging
Security headers/CSP baseline
JWT auth and RBAC middleware
Prisma data model concepts
Redis/BullMQ queue domains
Graceful shutdown/runtime state
GitHub CI, quality gates, release validation
Mobile CI if mobile is in target scope
```

### What SHOULD Be Migrated

```text
Runtime supervisor/controller/recovery
Dead-letter queue and verification tests
Design-system tokens/components/standards
Storybook governance
Grafana queue dashboard
Deployment checklists and rollback docs
Expo mobile app structure
Mobile request ID API client
AI provider abstraction and gateway after core platform is stable
AI security modules before public AI launch
```

### What Should NOT Be Migrated

```text
node_modules
.pnpm-store / .pnpm-cache
dist
mobile/dist-mobile
mobile/.expo
.build-outputs
install logs
generated APKs
local cache folders
duplicative root legacy screen/state files unless manually reconciled
hardcoded placeholder Docker image names
raw production/staging env files with real secrets
```

### Migration Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Docker Node 20 vs app Node 22 | Build/runtime mismatch | Update Dockerfile to Node 22 first. |
| Env schema duplication | Staging/prod boot failures | Create one canonical env schema. |
| Entire repo untracked | No reliable changed-file diff | Use this blueprint path classification and manual code review. |
| PostgreSQL absent from CI services | Tests may pass/fail inconsistently depending on mocks | Add Postgres service and migrations. |
| In-memory rate limiter | Not correct for multi-instance production | Use Redis-backed limiter. |
| CSP allows inline scripts | XSS blast radius | Move to nonce/hash CSP where possible. |
| AI endpoints direct in `server.ts` | Harder to test and secure | Move to controllers/services in SALORA. |
| Frontend architecture fragmentation | Duplicate state/screens | Choose one target UI/state architecture before copying. |
| Mobile dependency versions are modern | Native module compatibility issues | Validate Expo SDK and EAS build early. |
| Metrics endpoint exposure | Information disclosure | Restrict by network/auth. |

### Estimated Migration Effort

| Scope | Estimate |
|---|---:|
| Foundation + env + CI | 2-4 engineer days |
| Observability + health + logging | 2-3 engineer days |
| Security + auth/RBAC/rate limits | 3-5 engineer days |
| Redis/BullMQ runtime + DLQ | 3-6 engineer days |
| Web design-system/UI adaptation | 4-8 engineer days |
| AI subsystem selective migration | 5-10 engineer days |
| Mobile workspace migration | 5-10 engineer days |
| Production hardening and launch validation | 4-7 engineer days |

Total recommended effort: 4-7 focused engineering weeks depending on SALORA's current baseline and how much AI/mobile surface is required for launch.

### Recommended Migration Order

1. Runtime/toolchain: Node 22, pnpm, TypeScript, env templates.
2. Backend shell: Express, config, logging, health endpoints.
3. Data layer: Prisma schema adaptation, Redis client, migrations.
4. Observability: correlation IDs, Sentry, OTel, Prometheus.
5. Security: CSP, auth, RBAC, rate limiting, redaction.
6. Queues/runtime: BullMQ domains, workers, DLQ, supervisor.
7. CI/CD: root CI, quality gates, release validation.
8. Web UI/design-system: tokens, components, selected panels.
9. AI features: provider gateway, Gemini endpoints, AI security.
10. Mobile: Expo Router app, API client, Sentry, EAS, mobile CI.
11. Deployment: Docker/Kubernetes, dashboards, rollout/rollback.
12. Launch readiness: stress, release candidate, staging signoff.

## Closing Migration Principle

Migrate DEV into SALORA as a sequence of verified capabilities, not as a bulk copy. The most valuable engineering work is the operational platform: runtime state, health checks, observability, security, CI/CD, queue governance, and mobile architecture. Those should become SALORA's foundation before the richer AI and UI systems are layered on top.
