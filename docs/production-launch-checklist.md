# Production Launch Checklist

## Secrets

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_APP_SECRET`
- `SENTRY_DSN`
- OpenTelemetry exporter settings

## Monitoring

- Sentry project connected.
- OpenTelemetry traces exporting.
- Metrics endpoint reachable.
- AI provider dashboard available.
- WhatsApp dashboard available.
- Database and Redis dashboard available.

## Backups

- PostgreSQL automated backups enabled.
- Backup restore tested in staging.
- Retention policy approved.

## Migrations

- Runtime persistence migration applied.
- Migration rollback decision documented.
- Schema drift check completed.

## Rollback

- Disable WhatsApp: `WHATSAPP_ENABLED=false`.
- Disable real AI: `AI_ENABLE_REAL_PROVIDERS=false`.
- Return AI provider to mock.
- Roll back deployment artifact.
- Keep data migrations forward-compatible during incident response.

## Alerts

- Webhook failure rate.
- AI provider failures.
- AI cost threshold.
- DB query timeout.
- Redis connection failure.
- Order API failures.

## Dashboards

- Executive launch dashboard.
- Channel health dashboard.
- AI runtime dashboard.
- Infrastructure dashboard.
