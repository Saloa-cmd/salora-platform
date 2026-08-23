import { getInfrastructureEnv } from "../../runtime/env";
import type { ServiceHealth } from "../../runtime/health";
import { queueNames } from "../queues/definitions";
import { getQueue } from "../queues/factory";

export async function queueHealth(): Promise<ServiceHealth> {
  const env = getInfrastructureEnv({ strict: false });

  if (!env.REDIS_URL) {
    return {
      name: "bullmq",
      status: env.NODE_ENV === "production" ? "critical" : "degraded",
      message: "REDIS_URL is not configured; queues cannot connect."
    };
  }

  try {
    const summaries = await Promise.all(queueNames.map(async (name) => {
      const queue = getQueue(name);
      const counts = await queue.getJobCounts("waiting", "active", "failed");
      return { name, counts };
    }));
    const failed = summaries.reduce((total, item) => total + (item.counts.failed ?? 0), 0);

    return {
      name: "bullmq",
      status: failed > 0 ? "degraded" : "healthy",
      metadata: {
        queues: summaries
      }
    };
  } catch (error) {
    return {
      name: "bullmq",
      status: "critical",
      message: error instanceof Error ? error.message : "Queue health check failed."
    };
  }
}
