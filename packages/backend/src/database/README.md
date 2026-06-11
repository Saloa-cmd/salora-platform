# SALORA Database Runtime

Production database runtime uses Prisma 7 with PostgreSQL adapter, a singleton client, query timing, timeout protection, transaction retries, and graceful shutdown hooks.

Required production env:

- `DATABASE_URL`
- `DATABASE_QUERY_TIMEOUT_MS`
- `DATABASE_SLOW_QUERY_MS`
- `DATABASE_RETRY_LIMIT`

Health is exposed through `databaseHealth()` and included in `/api/health` and `/api/ready`.
