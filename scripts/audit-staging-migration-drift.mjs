import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const PRODUCTION_ONLY_ALTERNATIVES = new Set([
  "202608050001_p22c3a_production_authority_schema_only"
]);

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

assert.equal(process.env.SALORA_ENVIRONMENT, "staging", "Migration drift audit is restricted to staging.");
const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
assert.ok(connectionString.includes(expectedRef), "Database connection does not match the expected staging project.");

const repositoryMigrations = readdirSync(new URL("../prisma/migrations/", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const appliedRows = await prisma.$queryRawUnsafe(`
    select migration_name
    from public._prisma_migrations
    where finished_at is not null
      and rolled_back_at is null
    order by migration_name
  `);
  const applied = new Set(appliedRows.map((row) => row.migration_name));
  const pending = repositoryMigrations.filter((name) => !applied.has(name));
  const stagingApplicable = pending.filter((name) => !PRODUCTION_ONLY_ALTERNATIVES.has(name));
  const productionOnlyAlternatives = pending.filter((name) => PRODUCTION_ONLY_ALTERNATIVES.has(name));

  const [authorityState] = await prisma.$queryRawUnsafe(`
    select
      to_regclass('public.menu_collections') is not null as "menuCollections",
      to_regclass('public.menu_collection_revisions') is not null as "menuRevisions",
      to_regclass('public.menu_publications') is not null as "menuPublications"
  `);

  console.log("SALORA Staging Prisma migration drift audit:");
  console.log(JSON.stringify({
    expectedProjectRef: expectedRef,
    repositoryMigrationCount: repositoryMigrations.length,
    appliedMigrationCount: applied.size,
    pending,
    stagingApplicable,
    productionOnlyAlternatives,
    authoritySchema: authorityState
  }, null, 2));

  if (stagingApplicable.length > 0) {
    console.error("STAGING_MIGRATION_DRIFT_DETECTED");
    process.exitCode = 2;
  } else {
    console.log("STAGING_PRISMA_MIGRATIONS_ALIGNED");
  }
} finally {
  await prisma.$disconnect();
}
