import { z } from "zod";
import { getInfrastructureEnv } from "../runtime/env";
import { getPrismaClient, withQueryProtection } from "../database/prisma";
import { incrementMetric } from "../runtime/metrics";

export const runtimeConfigScopes = [
  "PRICING",
  "PROMOTIONS",
  "LOYALTY",
  "AI_ROUTING",
  "AI_PROVIDER",
  "WHATSAPP",
  "NOTIFICATIONS",
  "FEATURE_FLAGS",
  "HOMEPAGE",
  "APP",
  "RECOMMENDATIONS"
] as const;

export const runtimeConfigInputSchema = z.object({
  scope: z.enum(runtimeConfigScopes),
  key: z.string().min(2).max(140),
  value: z.record(z.string(), z.unknown()),
  isActive: z.boolean().default(true)
});

export type RuntimeConfigInput = z.infer<typeof runtimeConfigInputSchema>;

export type RuntimeConfigRecord = RuntimeConfigInput & {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

const memoryConfig = new Map<string, RuntimeConfigRecord>();

function mapKey(scope: string, key: string) {
  return `${scope}:${key}`;
}

function databaseAvailable() {
  return Boolean(getInfrastructureEnv().DATABASE_URL);
}

export async function listRuntimeConfigurations() {
  if (!databaseAvailable()) {
    return {
      persistence: "unavailable" as const,
      reason: "DATABASE_URL is not configured; runtime configuration database storage is not active.",
      records: [...memoryConfig.values()]
    };
  }

  const prisma = getPrismaClient();
  const records = await withQueryProtection("runtime_configurations.list", () => prisma.$queryRaw<RuntimeConfigRecord[]>`
    SELECT
      id::text,
      scope::text,
      key,
      value,
      version,
      is_active AS "isActive",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM runtime_configurations
    ORDER BY scope ASC, key ASC
  `);

  return {
    persistence: "database" as const,
    records
  };
}

export async function upsertRuntimeConfiguration(input: RuntimeConfigInput) {
  if (!databaseAvailable()) {
    const existing = memoryConfig.get(mapKey(input.scope, input.key));
    const now = new Date().toISOString();
    const record: RuntimeConfigRecord = {
      ...input,
      id: existing?.id ?? crypto.randomUUID(),
      version: (existing?.version ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    memoryConfig.set(mapKey(input.scope, input.key), record);
    incrementMetric("salora_runtime_config_memory_writes_total");
    return {
      persistence: "unavailable" as const,
      warning: "DATABASE_URL is not configured; change was accepted only in process memory for local validation.",
      record
    };
  }

  const prisma = getPrismaClient();
  const rows = await withQueryProtection("runtime_configurations.upsert", () => prisma.$queryRaw<RuntimeConfigRecord[]>`
    INSERT INTO runtime_configurations (scope, key, value, is_active, updated_at)
    VALUES (${input.scope}::"RuntimeConfigScope", ${input.key}, ${JSON.stringify(input.value)}::jsonb, ${input.isActive}, CURRENT_TIMESTAMP)
    ON CONFLICT (scope, key)
    DO UPDATE SET
      value = EXCLUDED.value,
      is_active = EXCLUDED.is_active,
      version = runtime_configurations.version + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING
      id::text,
      scope::text,
      key,
      value,
      version,
      is_active AS "isActive",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `);
  incrementMetric("salora_runtime_config_database_writes_total");

  return {
    persistence: "database" as const,
    record: rows[0]
  };
}
