import { z } from "zod";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const infrastructureEnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  QUEUE_PREFIX: z.string().min(1).default("salora"),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  QUEUE_RETRY_LIMIT: z.coerce.number().int().min(0).default(3),
  QUEUE_BACKOFF_MS: z.coerce.number().int().positive().default(1000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  DATABASE_SLOW_QUERY_MS: z.coerce.number().int().positive().default(750),
  DATABASE_RETRY_LIMIT: z.coerce.number().int().min(0).default(2),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  REDIS_MAX_RETRIES_PER_REQUEST: z.coerce.number().int().min(0).default(3)
});

export type InfrastructureEnv = z.infer<typeof infrastructureEnvSchema>;

export function getInfrastructureEnv(options: { strict?: boolean } = {}): InfrastructureEnv {
  const parsed = infrastructureEnvSchema.safeParse(runtimeEnv);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`SALORA infrastructure env invalid: ${message}`);
  }

  if (options.strict || parsed.data.NODE_ENV === "production") {
    const missing = [
      !parsed.data.DATABASE_URL && "DATABASE_URL",
      !parsed.data.REDIS_URL && "REDIS_URL"
    ].filter(Boolean);

    if (missing.length > 0) {
      throw new Error(`SALORA infrastructure env missing required production values: ${missing.join(", ")}`);
    }
  }

  return parsed.data;
}
