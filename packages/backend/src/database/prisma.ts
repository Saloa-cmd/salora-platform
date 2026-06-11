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

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
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
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Database query timed out: ${operation}`)), env.DATABASE_QUERY_TIMEOUT_MS);
      });
      const result = await Promise.race([run(), timeout]);
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
