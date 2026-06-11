# SALORA Observability Production Certification

Date: 2026-06-08

Scope: Sentry server/edge/client setup, redaction, OpenTelemetry instrumentation, activity/audit logs, runtime visibility.

No error event was intentionally sent to Sentry.

## Decision

PARTIAL

Sentry setup, redaction, and instrumentation code exist, and activity/audit log tables contain data. Full certification is partial because no live Sentry event, trace export, dashboard receipt, or alert routing was verified.

## Evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Server Sentry | `apps/web/sentry.server.config.ts` initializes when `SENTRY_DSN` exists | PASS in code |
| Edge Sentry | `apps/web/sentry.edge.config.ts` initializes when `SENTRY_DSN` exists | PASS in code |
| Client Sentry | `apps/web/instrumentation-client.ts` initializes when `NEXT_PUBLIC_SENTRY_DSN` exists | PASS in code |
| PII handling | Sentry configs set `sendDefaultPii: false`; client replay masks text, inputs, and media | PASS in code |
| Redaction | Server sanitizer redacts authorization, cookies, tokens, secrets, database URLs, sessions, refresh tokens, payment secrets, and DSNs | PASS in code |
| Instrumentation | `apps/web/instrumentation.ts` registers Sentry | PASS in code |
| Activity logs | Live read-only count: 1 | PARTIAL |
| Audit logs | Live read-only count: 1 | PARTIAL |
| Trace exporter | No live exporter/dashboard receipt verified | PARTIAL |
| Alerting | No alert route or on-call receipt verified | PARTIAL |

## Required Actions

1. Send a controlled staging error event and confirm receipt in Sentry.
2. Confirm source-map upload policy and release mapping.
3. Confirm OpenTelemetry exporter destination and trace receipt.
4. Add or verify alert routing for auth failures, database failures, RLS denials, media publish failures, OpenAI fallback spikes, and WhatsApp webhook failures.

