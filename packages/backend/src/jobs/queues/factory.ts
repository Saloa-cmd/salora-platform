import { Queue, type JobsOptions } from "bullmq";
import { getInfrastructureEnv } from "../../runtime/env";
import { incrementMetric, setGauge } from "../../runtime/metrics";
import { getRedisConnectionOptions } from "../../cache/redis";
import type { BaseJobData, QueueName } from "./definitions";

const globalQueues = globalThis as typeof globalThis & {
  saloraQueues?: Map<QueueName, Queue>;
};

function defaultJobOptions(): JobsOptions {
  const env = getInfrastructureEnv();
  return {
    attempts: env.QUEUE_RETRY_LIMIT + 1,
    backoff: {
      type: "exponential",
      delay: env.QUEUE_BACKOFF_MS
    },
    removeOnComplete: 1000,
    removeOnFail: false
  };
}

export function getQueue(name: QueueName): Queue {
  globalQueues.saloraQueues ??= new Map();
  const existing = globalQueues.saloraQueues.get(name);

  if (existing) {
    return existing;
  }

  const env = getInfrastructureEnv();
  const queue = new Queue(`${env.QUEUE_PREFIX}:${name}`, {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: defaultJobOptions()
  });
  globalQueues.saloraQueues.set(name, queue);
  setGauge(`salora_queue_${name.replaceAll("-", "_")}_registered`, 1);
  return queue;
}

export async function enqueueJob(name: QueueName, data: BaseJobData): Promise<string> {
  const queue = getQueue(name);
  const job = await queue.add(name, data, {
    jobId: data.idempotencyKey
  });
  incrementMetric("salora_queue_jobs_enqueued_total");
  return job.id ?? data.idempotencyKey;
}

export async function closeQueues(): Promise<void> {
  const queues = globalQueues.saloraQueues;

  if (!queues) {
    return;
  }

  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queues.clear();
}
