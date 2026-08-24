import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const NON_PRODUCTION_REFS = new Set([
  "grcycqdtjjfklibutfos", // current salora-staging
  "errmouqcepkljncoefdd" // salora-pos-test
]);

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

assert.equal(process.env.SALORA_ENVIRONMENT, "production", "Production preflight is restricted to SALORA_ENVIRONMENT=production.");
const expectedRef = required("SALORA_EXPECTED_SUPABASE_PROJECT_REF");
assert.ok(!NON_PRODUCTION_REFS.has(expectedRef), "A known Staging/Test Supabase project cannot be certified as Production.");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
assert.ok(connectionString.includes(expectedRef), "Database connection does not match SALORA_EXPECTED_SUPABASE_PROJECT_REF.");

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

  const [authorityState] = await prisma.$queryRawUnsafe(`
    select
      to_regclass('public.catalog_products') is not null as "catalogProducts",
      to_regclass('public.product_categories') is not null as "productCategories",
      to_regclass('public.menu_collections') is not null as "menuCollections",
      to_regclass('public.menu_collection_revisions') is not null as "menuRevisions",
      to_regclass('public.menu_publications') is not null as "menuPublications"
  `);

  console.log("SALORA Production Data preflight (READ ONLY):");
  console.log(JSON.stringify({
    expectedProjectRef: expectedRef,
    environment: "production",
    repositoryMigrationCount: repositoryMigrations.length,
    appliedMigrationCount: applied.size,
    pending,
    authoritySchema: authorityState
  }, null, 2));

  if (pending.length > 0) {
    console.error("PRODUCTION_MIGRATION_DRIFT_DETECTED");
    process.exitCode = 2;
  } else if (!authorityState?.catalogProducts || !authorityState?.productCategories || !authorityState?.menuCollections || !authorityState?.menuRevisions || !authorityState?.menuPublications) {
    console.error("PRODUCTION_SCHEMA_INCOMPLETE");
    process.exitCode = 3;
  } else {
    console.log("PRODUCTION_SCHEMA_PREFLIGHT_PASS");
  }
} finally {
  await prisma.$disconnect();
}
