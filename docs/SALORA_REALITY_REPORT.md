# SALORA Real Status

Date: 2026-06-04  
Mode: Evidence-only executive architecture audit. No code, migrations, deployment, staging, or production mutation performed.

## Final Status

| Subsystem | Status | Evidence |
|---|---|---|
| DATABASE | BLOCKED | `DIRECT_URL` read-only access works; runtime `DATABASE_URL` fails with Prisma `P1000`; live Supabase missing `product_media_drafts` and `whatsapp_webhook_events` |
| CONTROL TOWER | PARTIAL | Implemented inside `apps/web`, not `apps/control-tower`; real screens/APIs exist; media and WhatsApp modules blocked by DB reality |
| WEBSITE | PARTIAL | Public menu reads DB in code but falls back to `@salora/data`; runtime DB is blocked |
| MOBILE | PARTIAL | Menu screen reads `/api/products`; multiple screens use static data and checkout is not verified as production order flow |
| OPENAI | PARTIAL | AI gateway and Control Tower routes exist; no live OpenAI call certified; image draft persistence blocked |
| WHATSAPP | BLOCKED | Code exists; Meta send test failed with HTTP 400; inbound persistence blocked by missing table |
| STRIPE | BLOCKED | Stripe provider code exists; payment mode is mock/disabled; no live payment transaction evidence |
| SENTRY | PARTIAL | Sentry config exists and DSN key is configured locally; no live event delivery verified |

## What Actually Works

- Prisma schema validates.
- Direct Supabase read-only connection through `DIRECT_URL` works.
- Live Supabase contains real catalog data: 96 products and 15 categories.
- Live Supabase contains 2 promotions, 2 coupons, 6 feature flags, and 3 runtime configuration records.
- Control Tower route and shell exist in `apps/web`.
- Product/category/coupon/promotion/feature-flag/runtime-config APIs exist in code.
- Website has a DB-backed public product read path.
- Mobile Menu has an API-backed product read path.

## What Partially Works

- Control Tower: broad UI and API surface exists, but not all modules are production-connected.
- AI: gateway exists, but live OpenAI execution and persisted AI output are not proven.
- Orders: DB-backed code exists, but live order count is 0 and runtime DB is blocked.
- Activity/Audit logs: tables and code exist, but live counts are 0.
- Payments: provider and tables exist, but live Stripe processing is not verified.
- Sentry: configuration exists, but no live event delivery evidence was collected.

## What Is Blocked

- Runtime database access through `DATABASE_URL`.
- WhatsApp production activation.
- WhatsApp webhook event persistence.
- Media draft and AI image draft persistence.
- Production certification for Control Tower modules that rely on the missing tables.

## What Exists Only In Code

- WhatsApp webhook event persistence references `whatsapp_webhook_events`, but the table is not deployed.
- Product media draft workflows reference `product_media_drafts`, but the table is not deployed.
- Several API flows exist without live persisted records.

## What Exists Only In Database

Several schema tables exist in live Supabase with no verified production workflow, including customer preferences, saved orders, availability rules, product variants/addons/modifiers, reconciliation records, and multiple loyalty/reward tables.

## What Exists Only In Documentation

Any claim that WhatsApp is ACTIVE, Stripe is live, AI image generation is operational, or the full Control Tower is production-ready is not supported by current evidence.

## Required Reality Before ACTIVE Status

- Fix runtime `DATABASE_URL` pooler authentication.
- Deploy or reconcile missing migrations for `product_media_drafts` and `whatsapp_webhook_events`.
- Verify live WhatsApp send, receive, delivery, read, and persistence.
- Verify live OpenAI generation and persisted AI records.
- Verify live Stripe payment flow or explicitly keep COD-only mode.
- Verify Control Tower CRUD end-to-end against production database.
- Remove or clearly govern fallback/static data behavior for production website and mobile.

## Supporting Reports

- `docs/database-reality-audit.md`
- `docs/control-tower-reality-audit.md`
- `docs/api-reality-audit.md`
- `docs/ai-reality-audit.md`
- `docs/whatsapp-reality-audit.md`
- `docs/website-reality-audit.md`
- `docs/mobile-reality-audit.md`
- `docs/production-readiness-reality.md`
