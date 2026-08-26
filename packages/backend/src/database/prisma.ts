import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool, type PoolClient } from "pg";
import { PrismaClient } from "./generated/client.ts";
import { getInfrastructureEnv } from "../runtime/env.ts";
import { incrementMetric, recordDuration, setGauge } from "../runtime/metrics.ts";
import { captureRuntimeError, withSpan } from "../observability/tracing.ts";

type SaloraPrismaClient = InstanceType<typeof PrismaClient>;

const globalPrisma = globalThis as typeof globalThis & {
  saloraPrisma?: SaloraPrismaClient;
  saloraPrismaConnecting?: Promise<SaloraPrismaClient>;
  saloraPgPool?: Pool;
  saloraPgPoolLiveness?: Promise<void>;
  saloraPgPoolLastLivenessAt?: number;
};

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (typeof candidate.code === "string") return candidate.code;
  return errorCode(candidate.cause);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return `${error.message} ${cause ? errorMessage(cause) : ""}`.trim();
  }
  return typeof error === "string" ? error : "";
}

export function isRetryableDatabaseConnectivityError(error: unknown): boolean {
  const code = errorCode(error);
  if (code && (
    code.startsWith("08")
    || ["57P01", "57P02", "57P03", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "P1001", "P1017"].includes(code)
  )) {
    return true;
  }

  return /query read timeout|connection (?:terminated|timeout|closed|reset)|connection terminated unexpectedly|connect_timeout|econnreset|econnrefused|socket hang up|broken pipe/i
    .test(errorMessage(error));
}

function recordPoolState(pool: Pool): void {
  setGauge("salora_database_pool_total", pool.totalCount);
  setGauge("salora_database_pool_idle", pool.idleCount);
  setGauge("salora_database_pool_waiting", pool.waitingCount);
}

async function probePoolOnce(pool: Pool): Promise<void> {
  const env = getInfrastructureEnv();
  const target = Math.max(1, Math.min(pool.idleCount || 1, env.DATABASE_POOL_MAX));
  const clients: PoolClient[] = [];

  try {
    for (let index = 0; index < target; index += 1) {
      clients.push(await pool.connect());
    }
  } catch (error) {
    for (const client of clients) client.release();
    throw error;
  }

  const results = await Promise.allSettled(clients.map((client) => {
    const query = {
      text: "SELECT 1",
      query_timeout: env.DATABASE_POOL_LIVENESS_TIMEOUT_MS
    };
    return client.query(query);
  }));
  let firstError: unknown;

  results.forEach((result, index) => {
    const failed = result.status === "rejected";
    clients[index]?.release(failed);
    if (failed && firstError === undefined) firstError = result.reason;
  });
  recordPoolState(pool);

  if (firstError !== undefined) throw firstError;
}

async function ensurePoolLiveness(force = false): Promise<void> {
  const pool = globalPrisma.saloraPgPool;
  if (!pool) return;

  const env = getInfrastructureEnv();
  const lastChecked = globalPrisma.saloraPgPoolLastLivenessAt ?? 0;
  if (!force && Date.now() - lastChecked < env.DATABASE_POOL_LIVENESS_INTERVAL_MS) return;

  if (!globalPrisma.saloraPgPoolLiveness) {
    globalPrisma.saloraPgPoolLiveness = (async () => {
      let attempt = 0;

      while (true) {
        try {
          await probePoolOnce(pool);
          globalPrisma.saloraPgPoolLastLivenessAt = Date.now();
          return;
        } catch (error) {
          incrementMetric("salora_database_pool_liveness_failures_total");
          if (!isRetryableDatabaseConnectivityError(error) || attempt >= env.DATABASE_RETRY_LIMIT) {
            captureRuntimeError(error, { component: "database", operation: "pool-liveness" });
            throw error;
          }
          attempt += 1;
          incrementMetric("salora_database_pool_liveness_retries_total");
          await new Promise((resolve) => setTimeout(resolve, Math.min(250, 50 * (2 ** attempt))));
        }
      }
    })().finally(() => {
      globalPrisma.saloraPgPoolLiveness = undefined;
    });
  }

  return globalPrisma.saloraPgPoolLiveness;
}

export function getPrismaClient(): SaloraPrismaClient {
  if (globalPrisma.saloraPrisma) {
    return globalPrisma.saloraPrisma;
  }

  const env = getInfrastructureEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma runtime.");
  }

  // Keep a direct reference to the pg pool so Vercel Fluid Compute can release
  // idle sockets before suspending an instance and liveness probes can destroy
  // stale clients without terminating healthy concurrent requests.
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT_MS,
    query_timeout: env.DATABASE_QUERY_TIMEOUT_MS,
    statement_timeout: env.DATABASE_QUERY_TIMEOUT_MS,
    idleTimeoutMillis: env.DATABASE_POOL_IDLE_TIMEOUT_MS,
    maxLifetimeSeconds: env.DATABASE_POOL_MAX_LIFETIME_SECONDS,
    max: env.DATABASE_POOL_MAX,
    min: 0,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1000
  });
  pool.on("error", (error) => {
    incrementMetric("salora_database_pool_background_errors_total");
    captureRuntimeError(error, { component: "database", operation: "pool-background" });
    recordPoolState(pool);
  });
  if (process.env.VERCEL === "1") attachDatabasePool(pool);

  const adapter = new PrismaPg(pool);
  globalPrisma.saloraPgPool = pool;
  globalPrisma.saloraPrisma = new PrismaClient({ adapter });
  setGauge("salora_database_client_singleton", 1);
  recordPoolState(pool);
  return globalPrisma.saloraPrisma;
}

export async function connectPrisma(options: { forceLiveness?: boolean } = {}): Promise<SaloraPrismaClient> {
  if (!globalPrisma.saloraPrismaConnecting) {
    globalPrisma.saloraPrismaConnecting = withSpan("database.connect", {}, async () => {
      const started = Date.now();
      const prisma = getPrismaClient();
      await prisma.$connect();
      recordDuration("salora_database_connect_duration_ms", Date.now() - started);
      setGauge("salora_database_connected", 1);
      return prisma;
    }).catch((error) => {
      incrementMetric("salora_database_connection_failures_total");
      setGauge("salora_database_connected", 0);
      captureRuntimeError(error, { component: "database", operation: "connect" });
      globalPrisma.saloraPrismaConnecting = undefined;
      throw error;
    });
  }

  const prisma = await globalPrisma.saloraPrismaConnecting;
  await ensurePoolLiveness(options.forceLiveness);
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalPrisma.saloraPrisma) {
    return;
  }

  await globalPrisma.saloraPrisma.$disconnect();
  globalPrisma.saloraPrisma = undefined;
  globalPrisma.saloraPrismaConnecting = undefined;
  globalPrisma.saloraPgPool = undefined;
  globalPrisma.saloraPgPoolLiveness = undefined;
  globalPrisma.saloraPgPoolLastLivenessAt = undefined;
  setGauge("salora_database_connected", 0);
}

export async function withQueryProtection<T>(operation: string, run: () => Promise<T>): Promise<T> {
  const env = getInfrastructureEnv();
  const started = Date.now();

  return withSpan("database.query", { "db.operation": operation }, async (span) => {
    try {
      const result = await run();
      const duration = Date.now() - started;
      recordDuration("salora_database_query_duration_ms", duration);
      if (duration >= env.DATABASE_SLOW_QUERY_MS) {
        incrementMetric("salora_database_slow_queries_total");
        span.setAttribute("salora.slow_query", true);
      }
      return result;
    } catch (error) {
      incrementMetric("salora_database_query_failures_total");
      captureRuntimeError(error, { component: "database", operation });
      throw error;
    }
  });
}

export async function withDatabaseReadRecovery<T>(operation: string, run: () => Promise<T>): Promise<T> {
  const env = getInfrastructureEnv();
  let attempt = 0;

  while (true) {
    try {
      await connectPrisma({ forceLiveness: attempt > 0 });
      return await withQueryProtection(operation, run);
    } catch (error) {
      if (!isRetryableDatabaseConnectivityError(error) || attempt >= env.DATABASE_RETRY_LIMIT) {
        throw error;
      }

      attempt += 1;
      globalPrisma.saloraPgPoolLastLivenessAt = 0;
      incrementMetric("salora_database_read_retries_total");
      await ensurePoolLiveness(true);
      await new Promise((resolve) => setTimeout(resolve, Math.min(250, 50 * (2 ** attempt))));
    }
  }
}
