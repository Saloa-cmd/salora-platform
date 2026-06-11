# SALORA PostgreSQL Runtime

## Capabilities

- Prisma 7 generated client under `packages/backend/src/database/generated`.
- PostgreSQL adapter runtime.
- Singleton Prisma client.
- Query timeout protection.
- Slow query metric.
- Transaction helper with retry accounting.
- Health and migration status checks.
- Graceful shutdown.

## Required Env

- `DATABASE_URL`
- `DATABASE_QUERY_TIMEOUT_MS`
- `DATABASE_SLOW_QUERY_MS`
- `DATABASE_RETRY_LIMIT`

## Scaling Strategy

Use deployment-level pooling or a PostgreSQL pooler for serverless/high-concurrency deployments. The app-level Prisma singleton avoids per-request client creation.
