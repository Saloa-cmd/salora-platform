# Production Activation Checklist

## Secrets

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_APP_SECRET`
- `OPENAI_API_KEY` for staging only
- `GEMINI_API_KEY` for staging only

## Staging Validation

- Apply Prisma migrations.
- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Run `pnpm test`.
- Run `pnpm build`.
- Verify `/api/ready`, `/api/health`, `/api/metrics`.
- Verify WhatsApp webhook challenge.
- Replay a webhook payload and confirm idempotency.

## Rollback Plan

- Disable WhatsApp via `WHATSAPP_ENABLED=false`.
- Disable real providers via `AI_ENABLE_REAL_PROVIDERS=false`.
- Revert traffic to mock AI provider.
- Roll back deployment to previous build.
- Keep database migration forward-compatible; do not drop runtime records during incident response.

## Monitoring Verification

- Confirm Sentry environment and release metadata.
- Confirm OpenTelemetry exporter.
- Confirm metrics scrape.
- Confirm channel and AI dashboards.
- Confirm alert routing.
