import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.ts";
import { getInfrastructureEnv } from "../runtime/env.ts";
import { incrementMetric, recordDuration, setGauge } from "../runtime/metrics.ts";
import { captureRuntimeError, withSpan } from "../observability/tracing.ts";

type SaloraPrismaClient = InstanceType<typeof PrismaClient>;

const globalPrisma = globalThis as typeof globalThis & {
  saloraPrisma?: SaloraPrismaClient;
  saloraPrismaConnecting?: Promise<SaloraPrismaClient>;
};

export function getPrismaClient(): SaloraPrismaClient {
  if (globalPrisma.saloraPrisma) {
    return globalPrisma.saloraPrisma;
  }

  const env = getInfrastructureEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma runtime.");
  }

  // Let node-postgres enforce timeouts at the connection/query layer so timed
  // out work is actually cancelled. A Promise.race around Prisma only rejects
  // the caller while the underlying query keeps occupying a pooled connection,
  // which can create cascading pool starvation in serverless runtimes.
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: env.DATABASE_QUERY_TIMEOUT_MS,
    query_timeout: env.DATABASE_QUERY_TIMEOUT_MS,
    statement_timeout: env.DATABASE_QUERY_TIMEOUT_MS,
    idleTimeoutMillis: 10_000,
    max: 5
  });
  globalPrisma.saloraPrisma = new PrismaClient({ adapter });
  setGauge("salora_database_client_singleton", 1);
  return globalPrisma.saloraPrisma;
}

export async function connectPrisma(): Promise<SaloraPrismaClient> {
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

  return globalPrisma.saloraPrismaConnecting;
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalPrisma.saloraPrisma) {
    return;
  }

  await globalPrisma.saloraPrisma.$disconnect();
  globalPrisma.saloraPrisma = undefined;
  globalPrisma.saloraPrismaConnecting = undefined;
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
