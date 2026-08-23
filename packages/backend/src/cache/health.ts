import { getInfrastructureEnv } from "../runtime/env";
import type { ServiceHealth } from "../runtime/health";
import { connectRedis } from "./redis";

export async function redisHealth(): Promise<ServiceHealth> {
  const env = getInfrastructureEnv({ strict: false });

  if (!env.REDIS_URL) {
    return {
      name: "redis",
      status: env.NODE_ENV === "production" ? "critical" : "degraded",
      message: "REDIS_URL is not configured."
    };
  }

  const started = Date.now();

  try {
    const redis = await connectRedis();
    const pong = await redis.ping();
    return {
      name: "redis",
      status: pong === "PONG" ? "healthy" : "degraded",
      latencyMs: Date.now() - started,
      metadata: {
        connectionStatus: redis.status
      }
    };
  } catch (error) {
    return {
      name: "redis",
      status: "critical",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Redis health check failed."
    };
  }
}
