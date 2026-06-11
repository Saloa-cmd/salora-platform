# Simple Launch Performance Optimization Plan

Date: 2026-06-02

## Scope

No new features. Optimize only what affects launch speed, payment confidence, dashboard usability, API latency, database pressure, and Redis efficiency.

## Current Build Signal

Latest observed production build:

- Compile: approximately 2.3 minutes
- Sentry compile hook: approximately 13 seconds
- TypeScript: approximately 89 seconds
- Static generation: 36 pages in approximately 2.4 seconds
- Operational dashboards and APIs: dynamic runtime routes

## Priorities

| Area | Launch Optimization |
|---|---|
| Page speed | Keep homepage and product surfaces lightweight; defer non-critical client code. |
| Dashboard speed | Keep dashboards dynamic, use existing adapters, avoid adding charts/widgets before launch. |
| API latency | Track `/api/products`, `/api/orders`, `/api/payments/*`, `/api/ai/*`, `/api/intelligence/revenue`. |
| Database efficiency | Use existing Prisma query protection and runtime config table; avoid build-time DB work. |
| Redis efficiency | Use certified queues only for launch-critical jobs; monitor queue depth and retries. |
| AI latency | OpenAI primary with mock fallback; track latency and evaluation scores. |
| Payment latency | Track PaymentIntent and refund latency; verify webhook delivery before real traffic. |
| Error visibility | Use Sentry for launch error capture; postpone OTEL exporter until approved. |

## Launch Targets

| Target | Threshold |
|---|---:|
| Customer page TTFB | < 700 ms on warm runtime |
| Dashboard TTFB | < 900 ms |
| Product API latency | < 300 ms |
| Order API latency | < 400 ms |
| Payment API latency | Provider-dependent, monitored |
| AI API latency | Provider-dependent, monitored with fallback |
| Static generation | < 10 seconds |

## Actions

1. Keep only truly static pages static.
2. Keep dashboards runtime-driven.
3. Avoid importing provider SDKs into client bundles.
4. Do not expand dashboard widgets before soft launch.
5. Monitor Sentry errors daily during launch stages.
6. Review Redis queue depth and failed jobs daily.
7. Review Stripe latency and refund failures after every launch stage.
