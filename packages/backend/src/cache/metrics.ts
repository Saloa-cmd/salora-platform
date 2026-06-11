import { getRedisClient } from "./redis";
import { setGauge } from "../runtime/metrics";

export function collectRedisMetrics(): void {
  try {
    const redis = getRedisClient();
    setGauge("salora_redis_connected", redis.status === "ready" ? 1 : 0);
  } catch {
    setGauge("salora_redis_connected", 0);
  }
}
