import Redis from "ioredis";
import { getInfrastructureEnv } from "../runtime/env";
import { setGauge } from "../runtime/metrics";
import { captureRuntimeError, withSpan } from "../observability/tracing";
import { redisRetryStrategy } from "./retry";

const globalRedis = globalThis as typeof globalThis & {
  saloraRedis?: Redis;
};

export function getRedisClient(): Redis {
  if (globalRedis.saloraRedis) {
    return globalRedis.saloraRedis;
  }

  const env = getInfrastructureEnv();

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required for Redis runtime.");
  }

  const client = new Redis(env.REDIS_URL, {
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST,
    retryStrategy: redisRetryStrategy,
    lazyConnect: true
  });

  client.on("connect", () => setGauge("salora_redis_connected", 1));
  client.on("close", () => setGauge("salora_redis_connected", 0));
  client.on("error", (error) => captureRuntimeError(error, { component: "redis" }));
  globalRedis.saloraRedis = client;
  return client;
}

export function getRedisConnectionOptions() {
  const env = getInfrastructureEnv();

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required for Redis runtime.");
  }

  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST
  };
}

export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();

  if (client.status === "wait" || client.status === "end") {
    await withSpan("redis.connect", {}, async () => {
      await client.connect();
    });
  }

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!globalRedis.saloraRedis) {
    return;
  }

  await globalRedis.saloraRedis.quit();
  globalRedis.saloraRedis = undefined;
  setGauge("salora_redis_connected", 0);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await connectRedis();
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = await connectRedis();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
