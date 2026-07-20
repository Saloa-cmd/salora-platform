import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../../cache/redis";
import { getInfrastructureEnv } from "../../runtime/env";
import type { BaseJobData, QueueName } from "./definitions";

export type DeadLetterData = BaseJobData & {
  sourceQueue: QueueName;
  failedReason?: string;
  failedAt: string;
};

let deadLetterQueue: Queue | undefined;

export function getDeadLetterQueue(): Queue {
  if (deadLetterQueue) {
    return deadLetterQueue;
  }

  const env = getInfrastructureEnv();
  deadLetterQueue = new Queue(`${env.QUEUE_PREFIX}-dead-letter`, {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false
    }
  });
  return deadLetterQueue;
}

export async function sendToDeadLetter(sourceQueue: QueueName, data: BaseJobData, failedReason?: string): Promise<void> {
  await getDeadLetterQueue().add(`${sourceQueue}:failed`, {
    ...data,
    sourceQueue,
    failedReason,
    failedAt: new Date().toISOString()
  });
}
