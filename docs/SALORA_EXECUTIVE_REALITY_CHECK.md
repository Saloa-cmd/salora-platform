# SALORA Executive Reality Check

Date: 2026-06-07  
Role: CTO launch readiness review  
Scope: Business readiness only. Figma, visual redesign, and new dashboards are intentionally excluded.  
Final Decision: NEEDS_CRITICAL_FIXES

## Executive Summary

SALORA has a credible platform foundation: Prisma-backed domains, Control Tower route protection, COD order APIs, product media draft governance, AI provider governance, WhatsApp provider scaffolding, health endpoints, and passing validation scripts in the latest stabilization run.

It is not yet ready for soft launch as a production business runtime. The critical blockers are production admin auth persistence, mobile API rendering, verified Supabase authority, and provider readiness proof for OpenAI/WhatsApp. Public menu rendering is launch-shaped but can silently fall back to packaged data, which is acceptable for a showcase but risky for a live commercial menu unless actively monitored and gated.

## 1. Admin Login Runtime

Current state: Not production-ready.

Evidence:

- `apps/web/app/api/auth/login/route.ts` implements login, validates payload, issues cookies through `applyAuthCookies`.
- `apps/web/lib/server/auth/service.ts` supports register, login, refresh, logout, JWT issue/verify.
- `apps/web/lib/server/auth/runtime.ts` uses `MemoryAuthRepository` whenever `AUTH_USE_MEMORY_STORE=true` or `NODE_ENV !== "production"`.
- In production, `runtime.ts` throws `AuthRepositoryUnavailableError` instead of selecting a Prisma repository.

Risk level: Critical.

Business impact: Admin access can work in development-style sessions but is not certified as persistent production login. A soft launch that needs real operators cannot rely on memory auth or an unavailable repository path.

Required fix: Wire production `getRepository()` to `PrismaAuthRepository` when production database env is present, keep memory store only for explicit local/dev mode, then certify login, refresh, logout, and session persistence against Supabase/Postgres.

Estimated effort: 1-2 days.

## 2. Control Tower Access

Current state: Partially ready, dependent on admin login fix.

Evidence:

- `apps/web/app/(control-tower)/control-tower/page.tsx` and `[section]/page.tsx` call `requireControlTowerPageAccess()`.
- `requireControlTowerPageAccess()` redirects unauthenticated users and denies users outside `STAFF`, `MANAGER`, `ADMIN`.
- `apps/web/app/api/admin/rbac-check/route.ts` enforces `MANAGER`/`ADMIN`.
- `apps/web/lib/server/simpleLaunchControl.ts` enforces permission checks for Control Tower API mutations.

Risk level: High.

Business impact: The route guard and RBAC model exist, but live operator access cannot be fully trusted until production auth persistence is fixed and certified. Control Tower UI may render correctly for a valid cookie but the launch system needs durable sessions and role assignment.

Required fix: After production auth persistence is wired, certify `/control-tower`, `/control-tower/content`, and write APIs with real `STAFF`, `MANAGER`, and `ADMIN` accounts plus negative tests for `CUSTOMER`.

Estimated effort: 0.5-1 day after auth fix.

## 3. Product Media Workflow

Current state: Launch-shaped but needs operational certification.

Evidence:

- `apps/web/app/api/control-tower/media/route.ts` supports image prompt drafts, manual draft creation, approve/reject/archive, publish only after approval, primary selection, replace, reorder, and archive.
- Publishing a draft requires `APPROVED` status and a real `storagePath` or `publicUrl`.
- Activity and audit logs are written for draft creation, approval, publish, primary, replace, archive, and reorder.
- `ProductMediaDraft` and `ProductImage` models exist in Prisma generated output and schema.

Risk level: Medium.

Business impact: The product media lifecycle protects against auto-publishing generated media and supports human approval. The remaining risk is operational: storage ownership, real image URLs, operator UX certification, and ensuring all products visible to public/mobile have approved primary images.

Required fix: Run an end-to-end media operation using a real product: create draft, approve draft, publish draft, set primary, verify public menu and mobile API output. Add a launch checklist for products missing primary images.

Estimated effort: 1 day.

## 4. Public Menu Rendering

Current state: Partially ready with fallback risk.

Evidence:

- `apps/web/lib/server/publicMenu.ts` reads active `CatalogProduct` rows with category and images from Prisma.
- On database failure, it returns `@salora/data` fallback products with `stale: true`, `runtimeMode: "fallback"`, and `databaseHealth: "unavailable"`.
- `apps/web/app/page.tsx` renders from `getPublicMenuSnapshot()` and shows a visible banner when `menuSnapshot.stale`.
- `apps/web/app/api/products/route.ts` exposes `runtime.source`, `runtime.stale`, and database health headers.

Risk level: High.

Business impact: Public menu will render even when database is unavailable, which preserves visual availability but can sell stale or incorrect products if not operationally gated.

Required fix: For soft launch, decide that fallback mode is not launch-ready for commerce. Wire readiness/monitoring to fail or alert when `x-salora-stale=true`, and certify live database menu rendering with current product count, prices, categories, and image URLs.

Estimated effort: 0.5-1 day.

## 5. Mobile API Rendering

Current state: Not ready for production data.

Evidence:

- `apps/mobile/src/services/apiClient.ts` can call `EXPO_PUBLIC_API_URL` and sets `x-request-id`.
- `apps/mobile/app/(tabs)/home.tsx` imports `products` from `@salora/data` and renders local/static product data instead of fetching `/api/products`.
- Mobile components are present, but home rendering is not API-bound.

Risk level: Critical.

Business impact: Mobile can present a polished experience but cannot be trusted as a live menu/order surface because it does not render authoritative Supabase-backed product data.

Required fix: Replace static mobile menu reads with API-backed loading from `/api/products`, show visible loading/error/stale states, and ensure fallback is explicit. Keep UI minimal; do not redesign.

Estimated effort: 1-2 days.

## 6. COD Order Lifecycle

Current state: Strong backend foundation; needs live transaction certification.

Evidence:

- `apps/web/app/api/orders/route.ts` creates public COD orders through `createCodOrder()` and records activity/audit logs.
- `apps/web/app/api/control-tower/orders/route.ts` supports protected order reads, protected COD creation, and status PATCH.
- `assertOrderTransition()` is used before status updates.
- WhatsApp order notifications are attempted for order events but safely caught.
- Tests include `operations-intelligence`, `business-domain`, and `go-live-validation` passing in the latest stabilization run.

Risk level: Medium.

Business impact: COD can support a soft launch if database connectivity and operator workflow are certified. The largest risk is not schema shape; it is real order creation, status transition, notification side effects, and staff handling under live load.

Required fix: Execute a controlled COD order from public API through Control Tower status transitions: created, accepted/preparing/ready/delivered, with audit/timeline verification and WhatsApp disabled/failed behavior documented.

Estimated effort: 0.5-1 day.

## 7. OpenAI Production Workflow

Current state: Configured but not production-certified.

Evidence:

- `packages/backend/src/ai/providers/openai/provider.ts` uses `OPENAI_API_KEY`, checks `AI_ENABLE_REAL_PROVIDERS === "true"`, supports timeout cancellation, and calls OpenAI chat completions.
- `packages/backend/src/ai/gateway/gateway.ts` applies safety inspection, provider approval, environment allowance, cost controls, evaluation, metrics, and fallback.
- `.env` contains `OPENAI_API_KEY`, `AI_DEFAULT_PROVIDER`, `AI_ENABLE_REAL_PROVIDERS`, `AI_STAGING_REAL_PROVIDERS`, and rollout keys.
- AI runtime tests passed in the latest stabilization run.

Risk level: High.

Business impact: The OpenAI path is architected for production governance but needs a real provider smoke test and cost/rate-limit confirmation before customers or staff depend on AI output.

Required fix: Run a production-like AI request with real provider enabled in the intended environment, verify provider, model, correlation ID, safety result, cost metadata, persistence behavior, and failure fallback. Confirm no prompt/content secrets are stored.

Estimated effort: 0.5-1 day.

## 8. WhatsApp Readiness

Current state: Provider and webhook architecture exist; launch readiness unproven.

Evidence:

- `packages/backend/src/channels/whatsapp/provider.ts` sends text/template messages to Meta Graph API when `WHATSAPP_ENABLED=true`.
- `packages/backend/src/channels/whatsapp/config.ts` requires access token, phone number ID, and verify token.
- `packages/backend/src/channels/whatsapp/service.ts` handles inbound messages, idempotency, AI replies, conversation persistence, and delivery state.
- `apps/web/app/api/control-tower/whatsapp/route.ts` exposes command center status and creates WhatsApp drafts without sending.
- `.env.local` includes WhatsApp configuration keys.
- Omnichannel platform tests passed in the latest stabilization run.

Risk level: High.

Business impact: WhatsApp is strategically important for ordering and customer updates, but cannot be considered launch-ready until Meta credentials, webhook verification, signature verification, outbound send, and inbound reply are tested live.

Required fix: Run Meta webhook verification, signed inbound payload test, outbound template/text send to approved test number, and COD order notification test. Keep Control Tower drafts non-sending unless explicitly approved.

Estimated effort: 1-2 days depending on Meta account state.

## 9. Supabase Production Authority

Current state: Partially present through Prisma/Postgres; not fully certified as Supabase production authority.

Evidence:

- `packages/backend/src/database/prisma.ts` uses Prisma 7 generated client and `@prisma/adapter-pg` with `DATABASE_URL`.
- `packages/backend/src/database/health.ts` checks `DATABASE_URL`, connects Prisma, runs `SELECT 1`, and reports migration expectations.
- `.env` contains `DATABASE_URL` and `DIRECT_URL`.
- `.env.example` includes Supabase keys, but current `.env` key list did not show `SUPABASE_URL`, `SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY`.
- Prisma generated client imports `.ts` modules; TypeScript stabilization now requires `allowImportingTsExtensions`.

Risk level: Critical.

Business impact: Database-backed domains can work, but the business cannot claim Supabase production authority until the active environment is proven to point at the intended Supabase project, migrations are applied, and public/mobile/control-tower reads all use the same authority.

Required fix: Verify Supabase project identity, migration status, Prisma connectivity, table counts for catalog/media/orders/users, and backup/restore ownership. Document whether Supabase APIs are intentionally unused and Prisma/Postgres is the production authority.

Estimated effort: 1 day.

## P0 Roadmap

1. Production admin login persistence: wire production auth repository to Prisma and certify login/refresh/logout/session durability.
2. Supabase production authority: prove target DB identity, migrations, connectivity, and data counts.
3. Mobile API rendering: replace static home/menu product source with `/api/products` and explicit stale/error states.
4. Public menu launch gate: treat fallback/stale menu mode as a launch blocker or critical alert.

## P1 Roadmap

1. Product media end-to-end certification: draft, approve, publish, primary image, public/mobile visibility.
2. COD lifecycle certification: public order creation through Control Tower status transitions and audit/timeline verification.
3. OpenAI real-provider smoke test with safety, cost, provider, and persistence evidence.
4. WhatsApp live readiness test: webhook verification, signed inbound payload, outbound send, and order notification.

## P2 Roadmap

1. Operator playbooks for product media, COD exceptions, AI failure, and WhatsApp outage.
2. Monitoring dashboards/alerts for stale menu mode, database critical health, AI provider failure, and WhatsApp send failure.
3. Role matrix hardening for STAFF vs MANAGER vs ADMIN actions.
4. Mobile parity audit after API rendering is live.

## Final Decision

NEEDS_CRITICAL_FIXES

SALORA should not proceed to a customer-facing soft launch until P0 is resolved. A controlled internal demo or operator rehearsal is acceptable if it is explicitly labeled non-production and uses real database connectivity where possible.
