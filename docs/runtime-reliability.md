# SALORA Runtime Reliability

## Health States

- `healthy`: all required runtime services are available.
- `degraded`: optional/local dependency missing or failed but platform can continue.
- `critical`: production dependency is missing or failed.

## Observability

Infrastructure metrics are exported through `/api/metrics`. Tracing hooks use OpenTelemetry APIs and structured attributes for database, Redis, and queue operations.

## Troubleshooting

1. Check `/api/health`.
2. Check `/api/ready`.
3. Inspect `/api/metrics`.
4. Verify `DATABASE_URL` and `REDIS_URL`.
5. Inspect failed BullMQ jobs and the dead-letter queue.
