import { disconnectRedis } from "../cache/redis";
import { disconnectPrisma } from "../database/prisma";
import { closeQueues } from "../jobs/queues/factory";
import { closeWorkers } from "../jobs/workers/factory";

let registered = false;

export async function shutdownInfrastructure(): Promise<void> {
  await closeWorkers();
  await closeQueues();
  await disconnectRedis();
  await disconnectPrisma();
}

export function registerInfrastructureShutdown(): void {
  if (registered || typeof process === "undefined") {
    return;
  }

  registered = true;
  const shutdown = async () => {
    await shutdownInfrastructure();
  };

  process.once("beforeExit", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
