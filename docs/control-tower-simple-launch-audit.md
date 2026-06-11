# Control Tower Simple Launch Audit

Date: 2026-06-03

## Executive Finding

The existing Control Tower lives in the web app and is visually present, but Simple Launch commercial operations are only partially connected. The current product route and Control Tower product action use an in-memory backend service, not the deployed Supabase commercial catalog. Real product data has been imported into Supabase, but the website, mobile app, and Control Tower are not yet consistently reading that database-backed source.

## Actual Locations

| Area | Location | Status | Notes |
| --- | --- | --- | --- |
| Control Tower UI | `apps/web/app/(control-tower)/control-tower` and `apps/web/components/control-tower` | PARTIAL | Existing shell/sections are present, but many sections are modeled/static. |
| Control Tower registry | `apps/web/lib/control-tower/registry.ts` | PARTIAL | Lists many future capabilities, including postponed ones. Needs Simple Launch focus. |
| Admin dashboard routes | `apps/web/app/(dashboard)/dashboard/*` | CONNECTED | Existing executive/intelligence dashboards use `/api/intelligence/*`. |
| Current API routes | `apps/web/app/api/*` | PARTIAL | Auth, intelligence, payments, runtime config, products exist; commercial admin routes are mostly missing. |
| Prisma client | `packages/backend/src/database/generated` via `packages/backend/src/database/prisma.ts` | CONNECTED | Prisma 7 PostgreSQL adapter singleton exists. |
| Backend services | `packages/backend/src/*` | PARTIAL | Runtime, AI, payments, channels exist. Catalog services are currently in-memory. |
| Auth/RBAC | `apps/web/lib/server/auth/*`, `apps/web/lib/server/domainHttp.ts` | CONNECTED | JWT auth and permission checks exist. Admin-safe mutation routes can reuse `requirePermission`. |
| ActivityLog / AuditLog models | `prisma/schema.prisma` | MISSING | Models exist and are deployed, but no service/API integration found. |
| AI Gateway | `packages/backend/src/ai/gateway/gateway.ts`, `apps/web/app/api/ai/*` | CONNECTED | Existing AI route wrapper and provider gateway exist. Product-specific admin draft endpoints are missing. |
| Public product/menu source | `packages/data/src/index.ts` | UNSAFE | Static 9-product menu, not Supabase-backed real SALORA CSV data. |
| Mobile API consumption path | `apps/mobile/src/services/apiClient.ts` | PARTIAL | API client exists, but menu screen imports static `@salora/data`. |

## Service Boundaries

| Boundary | Current owner | Simple Launch role | Status |
| --- | --- | --- | --- |
| Web app/API adapter | `apps/web` | Route handlers, RBAC, Zod, Control Tower UI | PARTIAL |
| Backend platform package | `packages/backend` | Prisma, AI, runtime, payments, observability | CONNECTED |
| Static data package | `packages/data` | Legacy/public showcase data | UNSAFE for launch menu |
| Mobile app | `apps/mobile` | Customer menu/order UX | PARTIAL |
| Database | Supabase PostgreSQL | Source of truth for commercial data | CONNECTED |

## Event And Audit Flow

Target flow for P0 mutations:

1. Operator authenticates through existing JWT auth.
2. API route checks permission (`catalog:write` or `system:write`).
3. Zod validates input.
4. Route generates/propagates `x-request-id`.
5. Prisma writes the domain record.
6. `activity_logs` records the action.
7. `audit_logs` records before/after for material changes.
8. Control Tower refreshes or displays mutation result.

Current state: steps 1-4 exist in some routes; steps 5-8 are missing for commercial operations.

## Deployment Strategy

Use the existing Next.js web app as the deployable unit. No new app, dashboard shell, domain, schema, or infrastructure is required for P0. API routes should be additive files under `apps/web/app/api/control-tower/*` and should reuse `@salora/backend` Prisma runtime.

## Observability Strategy

Use existing `x-request-id` propagation, Sentry redaction, runtime metrics, `activity_logs`, and `audit_logs`. Do not expose secrets. Runtime configuration reads/writes must filter secret-looking keys.

## Classification

| Area | Classification |
| --- | --- |
| Products | MISSING |
| Categories | MISSING |
| Product Images | MISSING |
| Promotions | MISSING |
| Coupons | MISSING |
| Feature Flags | MISSING |
| Runtime Configuration | PARTIAL |
| AI Product Drafts / Suggestions | MISSING |
| Activity Logs | MISSING |
| Audit Logs | MISSING |
| Website DB menu sync | MISSING |
| Mobile DB menu sync | PARTIAL |

## Decision

Proceed with P0 implementation only. Keep postponed capabilities disabled or documented: WhatsApp, Gemini, advanced CMS, automation builder, multi-tenant, reservations, branches, advanced RLS, real image generation, and advanced approvals.
