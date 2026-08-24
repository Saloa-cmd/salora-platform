import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const baselineArtifactPath = resolve(root, "prisma/baselines/p22c3a-production-authority-schema-only.sql");
const manifestPath = resolve(root, "docs/P22C3A_PRODUCTION_AUTHORITY_SCHEMA_ONLY_MANIFEST.json");
const workflowPath = resolve(root, ".github/workflows/p22c3b-isolated-postgres.yml");
const syntheticBaselinePath = resolve(root, "scripts/p22c3b/legacy-baseline.sql");
const rollbackPath = resolve(root, "scripts/p22c3b/rollback.sql");
const approvedSha = "9dc141be031edc4956b59c0a89c8de10fadadfff0cac57168a150ff80e4b97c4";
const canonicalLf = (value) => value.replace(/\r\n?/gu, "\n");
const sha256 = (value) => createHash("sha256").update(canonicalLf(value), "utf8").digest("hex");

const migration = readFileSync(baselineArtifactPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const workflow = readFileSync(workflowPath, "utf8");
const syntheticBaseline = readFileSync(syntheticBaselinePath, "utf8");

assert.equal(sha256(migration), approvedSha, "Historical P22C-3A baseline SHA changed.");
assert.equal(manifest.migration.sha256, approvedSha);
assert.equal(manifest.migration.path, "prisma/baselines/p22c3a-production-authority-schema-only.sql");
assert.equal(manifest.environmentIdentity, "HISTORICAL_ONLY_DO_NOT_ROUTE");
assert.match(workflow, /image:\s*postgres:17-alpine/);
assert.doesNotMatch(workflow, /SUPABASE|PRODUCTION_DATABASE|VERCEL_ENV|DATABASE_URL:\s*\$\{\{\s*secrets/iu);
assert.match(syntheticBaseline, /generate_series\(1,\s*117\)/);
assert.match(syntheticBaseline, /product_number\s*<=\s*104/);
assert.match(syntheticBaseline, /generate_series\(1,\s*16\)/);

console.log("P22C-3B contract: certified historical baseline is isolated and secret-free.");
if (process.argv.includes("--contract-only")) process.exit(0);

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required inside the isolated PostgreSQL job.");
const reportPath = process.env.P22C3B_REPORT_PATH ?? resolve(root, "p22c3b-certification.json");

function psql(args, input) {
  const result = spawnSync("psql", [databaseUrl, "-X", "-v", "ON_ERROR_STOP=1", ...args], {
    encoding: "utf8",
    input,
    maxBuffer: 30 * 1024 * 1024
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`psql failed with exit code ${result.status}`);
  }
  return (result.stdout ?? "").trim();
}

const scalar = (sql) => psql(["-A", "-t", "-q", "-c", sql]).trim();
psql(["-f", syntheticBaselinePath]);
assert.match(scalar("show server_version"), /^17\./);

const before = {
  total: Number(scalar("select count(*) from public.catalog_products")),
  active: Number(scalar("select count(*) from public.catalog_products where status='ACTIVE'")),
  draft: Number(scalar("select count(*) from public.catalog_products where status='DRAFT'")),
  categories: Number(scalar("select count(*) from public.product_categories"))
};
assert.deepEqual(before, { total: 117, active: 104, draft: 13, categories: 16 });

psql([], canonicalLf(migration));
const after = {
  total: Number(scalar("select count(*) from public.catalog_products")),
  active: Number(scalar("select count(*) from public.catalog_products where status='ACTIVE'")),
  draft: Number(scalar("select count(*) from public.catalog_products where status='DRAFT'")),
  categories: Number(scalar("select count(*) from public.product_categories")),
  authorityTables: Number(scalar("select count(*) from pg_tables where schemaname='public' and tablename in ('menu_collections','menu_collection_sections','menu_collection_products','product_nutrition_profiles','product_allergen_profiles','menu_collection_revisions','menu_publications','menu_role_permissions')")),
  authorityPolicies: Number(scalar("select count(*) from pg_policies where schemaname='public' and tablename in ('menu_collections','menu_collection_sections','menu_collection_products','product_nutrition_profiles','product_allergen_profiles','menu_collection_revisions','menu_publications','menu_role_permissions')"))
};
assert.deepEqual({ total: after.total, active: after.active, draft: after.draft, categories: after.categories }, before);
assert.equal(after.authorityTables, 8);
assert.equal(after.authorityPolicies, 24);

psql(["-f", rollbackPath]);
const remainingAuthorityTables = Number(scalar("select count(*) from pg_tables where schemaname='public' and tablename like 'menu_%'"));
assert.equal(remainingAuthorityTables, 0, "Rollback left Menu Authority tables in the isolated database.");

const report = {
  schemaVersion: 2,
  phase: "P22C-3B",
  environment: "isolated-postgres-17",
  baselineSha256: approvedSha,
  catalogBefore: before,
  catalogAfter: { total: after.total, active: after.active, draft: after.draft, categories: after.categories },
  authority: { tables: after.authorityTables, policies: after.authorityPolicies },
  rollback: "PASS",
  externalProductionConnectionUsed: false
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
console.log("P22C-3B isolated certification PASS");
