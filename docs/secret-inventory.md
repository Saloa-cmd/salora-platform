# Secret Inventory

Date: 2026-06-01

## Scope

This inventory classifies secret coverage without exposing values. Secrets must remain in local untracked env files, CI secret storage, or managed provider secret stores. `.env.example` must contain placeholders only.

## Inventory

| Domain | Secrets | Status | Notes |
|---|---|---|---|
| Database | `DATABASE_URL`, `DIRECT_URL` | Activated | Supabase staging PostgreSQL migrations and table certification passed. |
| Redis | `REDIS_URL` | Activated | Upstash Redis and BullMQ runtime certification passed. |
| OpenAI | `OPENAI_API_KEY` | Configured | Credential present locally; real provider traffic remains disabled. Connectivity is blocked by provider quota. |
| Gemini | `GEMINI_API_KEY` | Configured | Credential present locally; real provider traffic remains disabled. |
| WhatsApp | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_SECRET` | Missing | `WHATSAPP_ENABLED` must remain false until Meta staging validation passes. |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` | Missing | `STRIPE_ENABLED` must remain false until test-mode certification passes. |
| Firebase | `FIREBASE_SERVICE_ACCOUNT_KEY`, `FIREBASE_PROJECT_ID` | Missing | Optional future integration; not required for current runtime. |
| Sentry | `SENTRY_DSN`, `SENTRY_RELEASE` | Missing | Error monitoring export not activated. |
| OTEL | `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_ENDPOINT`, `OTEL_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` | Pending | Local defaults exist; staging exporter credentials not validated. |

## Current Coverage

- Activated infrastructure secrets: Database, Redis.
- Configured but not activated provider secrets: OpenAI, Gemini.
- Missing provider secrets: WhatsApp, Stripe, Firebase, Sentry.

No secret values are stored in this document.
