# SALORA Queue Governance

## Job Contract

Every job includes:

- `idempotencyKey`
- `correlationId`
- `requestedAt`
- `payload`

## Failure Policy

Jobs retry according to `QUEUE_RETRY_LIMIT` and `QUEUE_BACKOFF_MS`. Exhausted jobs are copied to the dead-letter queue for inspection.

## Cancellation

Cancellation should remove pending jobs by job ID/idempotency key. Active cancellation requires processor-level cooperation.
