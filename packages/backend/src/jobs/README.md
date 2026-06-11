# SALORA BullMQ Runtime

Queues:

- email
- notifications
- analytics
- ai-tasks
- media-processing

Each job carries an idempotency key, optional correlation ID, retry policy, exponential backoff, and failure metrics. Failed jobs are retained for dead-letter inspection and recovery workflows.
