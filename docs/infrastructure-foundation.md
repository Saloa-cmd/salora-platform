# SALORA Production Infrastructure Foundation

SALORA now has a dedicated `@salora/backend` package for production infrastructure boundaries: PostgreSQL/Prisma, Redis, BullMQ, runtime health, metrics, tracing hooks, and graceful shutdown.

## Architecture

- `packages/backend/src/database`: Prisma runtime, transactions, health, shutdown.
- `packages/backend/src/cache`: Redis runtime, retry strategy, metrics, health.
- `packages/backend/src/jobs`: BullMQ queues, workers, processors, monitoring, health.
- `packages/backend/src/runtime`: env validation, health aggregation, metrics, shutdown.
- `packages/backend/src/observability`: OpenTelemetry span wrappers and Sentry-ready error context.

## Operational Flow

Requests hit Next.js API routes, inherit `x-request-id`, and can inspect infrastructure through `/api/health`, `/api/ready`, and `/api/metrics`. Background processing uses named BullMQ queues with retry/backoff and dead-letter retention.

## Recovery Flow

Services report `healthy`, `degraded`, or `critical`. Readiness remains usable for degraded local/dev states but returns unavailable for critical production dependencies.
