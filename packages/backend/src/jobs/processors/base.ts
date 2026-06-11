import type { Job } from "bullmq";
import { incrementMetric, recordDuration } from "../../runtime/metrics";
import { captureRuntimeError, withSpan } from "../../observability/tracing";
import type { BaseJobData, QueueName } from "../queues/definitions";
import { sendToDeadLetter } from "../queues/deadLetter";

export type JobProcessor = (job: Job<BaseJobData>) => Promise<void>;

export function createProcessor(queueName: QueueName, processor: JobProcessor): JobProcessor {
  return async (job) => {
    const started = Date.now();

    await withSpan("queue.process", {
      "messaging.destination": queueName,
      "messaging.message.id": job.id ?? "unknown",
      "salora.idempotency_key": job.data.idempotencyKey,
      "salora.correlation_id": job.data.correlationId ?? "none"
    }, async () => {
      try {
        await processor(job);
        incrementMetric("salora_queue_jobs_completed_total");
      } catch (error) {
        incrementMetric("salora_queue_jobs_failed_total");
        captureRuntimeError(error, { component: "bullmq", queueName, jobId: job.id });
        if ((job.attemptsMade + 1) >= (job.opts.attempts ?? 1)) {
          await sendToDeadLetter(queueName, job.data, error instanceof Error ? error.message : "unknown failure");
        }
        throw error;
      } finally {
        recordDuration("salora_queue_job_duration_ms", Date.now() - started);
      }
    });
  };
}

export const noopProcessor: JobProcessor = async () => {};
