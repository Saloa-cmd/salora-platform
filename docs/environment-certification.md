# Environment Certification

Date: 2026-06-01

## Executive Verdict

SALORA environment contracts are defined, but live infrastructure activation is blocked until staging secrets and endpoints are installed. No secret values were inspected or exposed.

## Dependency Classification

| Dependency | Required variables | Status | Certification |
|---|---|---|---|
| PostgreSQL runtime | `DATABASE_URL` | BLOCKED | Required for production/staging runtime database activation. |
| PostgreSQL migrations | `DIRECT_URL` | BLOCKED | Required for Prisma migration execution against Supabase. |
| Redis | `REDIS_URL` | BLOCKED | Required for queue runtime and shared cache activation. |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` | PENDING | Required before protected customer/admin production use. |
| OpenAI | `OPENAI_API_KEY`, `AI_ENABLE_REAL_PROVIDERS=true` | BLOCKED | Provider code exists; credentials/flag required. |
| Gemini | `GEMINI_API_KEY`, `AI_ENABLE_REAL_PROVIDERS=true` | BLOCKED | Provider code exists; credentials/flag required. |
| WhatsApp | `WHATSAPP_ENABLED`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET` | BLOCKED | Meta staging activation required. |
| Stripe | `PAYMENTS_ENABLED`, `STRIPE_ENABLED`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | BLOCKED | Stripe test mode activation required. |
| Sentry | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` | PENDING | Optional but required for production error monitoring. |
| OpenTelemetry | `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT` | PENDING | Defaults exist; collector endpoint must be verified. |
| Diagnostics | `DIAGNOSTICS_TOKEN` | PENDING | Required to protect production metrics endpoint. |

## Runtime Dependencies

- Node engine: project expects `>=22 <23`; current shell reports Node `24.15.0`.
- Package manager: `pnpm@9.15.0`.
- Build/runtime: Next.js App Router with dynamic operational routes.

## Certification Result

Environment is software-ready but infrastructure-blocked for live activation. Required next action: install staging secrets and rerun provider/database/queue certification.

Supabase PostgreSQL status: `BLOCKED_BY_CREDENTIALS`.
