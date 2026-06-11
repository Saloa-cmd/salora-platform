import { getInfrastructureEnv } from "../runtime/env";
import { incrementMetric } from "../runtime/metrics";

export function redisRetryStrategy(times: number): number | null {
  const env = getInfrastructureEnv();

  if (times > env.REDIS_MAX_RETRIES_PER_REQUEST) {
    incrementMetric("salora_redis_retry_exhausted_total");
    return null;
  }

  incrementMetric("salora_redis_retries_total");
  return Math.min(times * 250, 2500);
}
