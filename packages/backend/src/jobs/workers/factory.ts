import { Worker, type WorkerOptions } from "bullmq";
import { getRedisConnectionOptions } from "../../cache/redis";
import { getInfrastructureEnv } from "../../runtime/env";
import { setGauge } from "../../runtime/metrics";
import { createProcessor, noopProcessor, type JobProcessor } from "../processors/base";
import type { BaseJobData, QueueName } from "../queues/definitions";

const globalWorkers = globalThis as typeof globalThis & {
  saloraWorkers?: Map<QueueName, Worker>;
};

export function getWorker(name: QueueName, processor: JobProcessor = noopProcessor): Worker {
  globalWorkers.saloraWorkers ??= new Map();
  const existing = globalWorkers.saloraWorkers.get(name);

  if (existing) {
    return existing;
  }

  const env = getInfrastructureEnv();
  const options: WorkerOptions = {
    connection: getRedisConnectionOptions(),
    concurrency: env.QUEUE_CONCURRENCY
  };
  const worker = new Worker(`${env.QUEUE_PREFIX}:${name}`, createProcessor(name, processor), options);
  worker.on("ready", () => setGauge(`salora_worker_${name.replaceAll("-", "_")}_ready`, 1));
  worker.on("closed", () => setGauge(`salora_worker_${name.replaceAll("-", "_")}_ready`, 0));
  globalWorkers.saloraWorkers.set(name, worker);
  return worker;
}

export async function closeWorkers(): Promise<void> {
  const workers = globalWorkers.saloraWorkers;

  if (!workers) {
    return;
  }

  await Promise.all([...workers.values()].map((worker) => worker.close()));
  workers.clear();
}
