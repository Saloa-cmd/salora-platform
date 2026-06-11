# SALORA Observability Runbook

Date: 2026-05-31

## Implemented Signals

- Request correlation through `x-request-id` middleware.
- `/api/health` for basic service health.
- `/api/live` for liveness probes.
- `/api/ready` for readiness checks against local runtime configuration.
- `/api/metrics` in Prometheus text format, protected in production by `DIAGNOSTICS_TOKEN`.
- `/api/runtime/inspect`, protected in production by `DIAGNOSTICS_TOKEN`.
- Next.js `instrumentation.ts` startup hook.
- OTel collector reference config at the repository root and under `observability/`.

## Blocked External Integrations

- Sentry SDK initialization requires `SENTRY_DSN`, release ownership, and source-map policy.
- OpenTelemetry SDK export requires dependency adoption and collector/exporter destination approval.
- Prometheus scraping requires network policy and deployment-level scrape configuration.
- Grafana dashboards require datasource names and production metric labels.

## Probe Contract

| Endpoint | Purpose | Expected |
|---|---|---|
| `/api/live` | Process is alive | `200` |
| `/api/ready` | App can serve traffic | `200` or `503` |
| `/api/health` | Human and CI health summary | `200` |
| `/api/metrics` | Prometheus metrics | `200` with token in production |
| `/api/runtime/inspect` | Runtime diagnostics | `200` with token in production |

