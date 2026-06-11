# SALORA API Reality Audit

Date: 2026-06-04  
Scope: `apps/web/app/api/*`, backend service usage, live database evidence.

## Executive Finding

API state is **PARTIAL**.

Reason: many endpoints exist and compile, but runtime database access through `DATABASE_URL` is blocked, several endpoints still use in-memory/static services, and two API areas depend on tables not deployed to Supabase.

## API Classification

| Endpoint / Area | Status | Evidence |
|---|---|---|
| `/api/products` GET | PARTIAL | Reads DB through `apps/web/lib/server/publicMenu.ts`, falls back to `@salora/data`; live DB has 96 products but runtime pooler is blocked |
| `/api/products` POST | PARTIAL | Uses backend domain product service; evidence indicates non-DB service path in `packages/backend/src/domains/services.ts` |
| `/api/orders` | PARTIAL | DB-backed order creation/read code exists; `cafe_orders` live count 0; runtime DB blocked |
| `/api/customers` | PARTIAL | Customer route exists; live `customer_profiles` count 0; some domain services are in-memory |
| `/api/inventory` | PARTIAL | Route exists; inventory tables exist but counts are 0; action panel uses endpoint but production DB workflow not verified |
| `/api/loyalty` | PARTIAL | Route exists; loyalty tables exist; no persisted live loyalty evidence |
| `/api/notifications` | PARTIAL | Route exists; notification tables exist; no live delivery evidence |
| `/api/control-tower/simple-launch/products` | PARTIAL | DB-backed and Control Tower connected; blocked by `DATABASE_URL` runtime auth |
| `/api/control-tower/simple-launch/categories` | PARTIAL | DB-backed; live category data exists; runtime DB blocked |
| `/api/control-tower/simple-launch/coupons` | PARTIAL | DB-backed; live coupon data exists; runtime DB blocked |
| `/api/control-tower/simple-launch/promotions` | PARTIAL | DB-backed; live promotion data exists; runtime DB blocked |
| `/api/control-tower/simple-launch/feature-flags` | PARTIAL | DB-backed; live feature flag data exists; runtime DB blocked |
| `/api/control-tower/simple-launch/runtime-config` | PARTIAL | DB-backed; live runtime configuration data exists; runtime DB blocked |
| `/api/control-tower/simple-launch/activity-logs` | PARTIAL | DB-backed read route exists; live count 0 |
| `/api/control-tower/simple-launch/audit-logs` | PARTIAL | DB-backed read route exists; live count 0 |
| `/api/control-tower/orders` | PARTIAL | DB-backed route exists; live orders count 0; runtime DB blocked |
| `/api/control-tower/media` | BROKEN | References `product_media_drafts`; live Supabase table is missing |
| `/api/control-tower/ai-studio` | PARTIAL | Text draft persistence table exists; image draft path depends on missing `product_media_drafts` |
| `/api/control-tower/whatsapp` | BROKEN | References WhatsApp persistence; `whatsapp_webhook_events` missing; live conversation counts 0 |
| `/api/control-tower/instagram` | PARTIAL | AI draft route exists; no live Instagram provider implementation verified |
| `/api/whatsapp/send` | BLOCKED | Route exists; previous live Meta send returned HTTP 400 code 100 invalid parameter |
| `/api/whatsapp/webhook` | BLOCKED | Route exists; webhook event persistence table missing in live Supabase |
| `/api/channels/whatsapp/webhook` | PARTIAL | Older webhook route exists; shares persistence and fallback-data concerns |
| `/api/payments/*` | PARTIAL | Stripe/payment provider code exists; payment mode is mock/disabled; no live payment evidence |
| `/api/health` | PARTIAL | Health route exists; not sufficient as production DB readiness proof |
| `/api/metrics` | PARTIAL | Metrics route exists; uses static/domain data in some paths |
| `/api/runtime/inspect` | PARTIAL | Route exists; inspection is not a production readiness guarantee |
| `/api/intelligence/*` | PARTIAL | Routes exist; many depend on internal/in-memory or AI paths; no live AI persistence evidence |

## Dead Code Finding

No endpoint was classified as **DEAD CODE** with certainty. Several endpoints are **PARTIAL** because they have route handlers but lack live persistence evidence.

## API Conclusion

The API surface is broad, but not uniformly production-backed. Catalog and Control Tower commercial data are closest to active. WhatsApp, media drafts, and runtime DB access are the main blockers.
