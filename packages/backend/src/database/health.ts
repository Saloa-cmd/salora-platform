import { getInfrastructureEnv } from "../runtime/env";
import type { ServiceHealth } from "../runtime/health";
import { connectPrisma, withQueryProtection } from "./prisma";

export async function databaseHealth(): Promise<ServiceHealth> {
  const env = getInfrastructureEnv();

  if (!env.DATABASE_URL) {
    return {
      name: "postgresql",
      status: env.NODE_ENV === "production" ? "critical" : "degraded",
      message: "DATABASE_URL is not configured."
    };
  }

  const started = Date.now();

  try {
    const prisma = await connectPrisma();
    await withQueryProtection("health.select_1", () => prisma.$queryRaw`SELECT 1`);
    return {
      name: "postgresql",
      status: "healthy",
      latencyMs: Date.now() - started,
      metadata: {
        migrationStatus: "schema-managed-by-prisma-migrations",
        connectionStatus: "connected"
      }
    };
  } catch (error) {
    return {
      name: "postgresql",
      status: "critical",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Database health check failed."
    };
  }
}

export async function databaseMigrationStatus(): Promise<ServiceHealth> {
  const env = getInfrastructureEnv();
  return {
    name: "postgresql-migrations",
    status: env.DATABASE_URL ? "healthy" : "degraded",
    message: env.DATABASE_URL ? "Migration table expected in configured PostgreSQL database." : "Cannot inspect migrations without DATABASE_URL.",
    metadata: {
      migrationPath: "prisma/migrations"
    }
  };
}
