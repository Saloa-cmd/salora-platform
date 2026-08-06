import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const canonicalLf = (value) => value.replace(/\r\n?/gu, "\n");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const read = (path) => canonicalLf(readFileSync(path, "utf8"));

const migrationPath =
  "prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql";
const approvedSha =
  "9dc141be031edc4956b59c0a89c8de10fadadfff0cac57168a150ff80e4b97c4";

const snapshot = read("scripts/p22c3c/sql/01_snapshot_read_only.sql");
const preflight = read("scripts/p22c3c/sql/02_preflight_read_only.sql");
const postApply = read("scripts/p22c3c/sql/03_post_apply_verify_read_only.sql");
const rollback = read("scripts/p22c3c/sql/04_rollback_authority_schema.sql");
const compare = read("scripts/p22c3c/compare-snapshots.mjs");
const documentation = read("docs/P22C3C_PRODUCTION_DDL_GATE.md");
const manifest = JSON.parse(
  readFileSync("docs/P22C3C_PRODUCTION_DDL_GATE_MANIFEST.json", "utf8")
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const migration = read(migrationPath);

assert.equal(sha256(migration), approvedSha);
assert.equal(manifest.phase, "P22C-3C");
assert.equal(manifest.mode, "PREPARATION_ONLY");
assert.equal(manifest.productionProjectRef, "grcycqdtjjfklibutfos");
assert.equal(manifest.productionExecutionAllowed, false);
assert.equal(manifest.finalApprovalIssued, false);
assert.equal(manifest.migration.path, migrationPath);
assert.equal(manifest.migration.sha256, approvedSha);
assert.equal(manifest.migration.hashCanonicalization, "UTF8_LF");

assert.equal(
  packageJson.scripts["test:p22c3c-production-ddl-gate"],
  "node scripts/p22c3c-production-ddl-gate.test.mjs"
);
assert.match(packageJson.scripts.test, /p22c3c-production-ddl-gate\.test\.mjs/u);

const readOnlyArtifacts = [snapshot, preflight, postApply];

for (const artifact of readOnlyArtifacts) {
  assert.match(artifact, /BEGIN TRANSACTION[\s\S]*READ ONLY;/u);
  assert.match(artifact, /ROLLBACK;/u);
  assert.doesNotMatch(artifact, /^\s*COMMIT\s*;/imu);

  for (const forbidden of [
    /^\s*CREATE\s+(?:TABLE|TYPE|INDEX|POLICY|FUNCTION|TRIGGER|EXTENSION)\b/imu,
    /^\s*ALTER\s+TABLE\b/imu,
    /^\s*DROP\s+/imu,
    /^\s*INSERT\s+INTO\b/imu,
    /^\s*UPDATE\s+(?!OF\b)/imu,
    /^\s*DELETE\s+FROM\b/imu,
    /^\s*TRUNCATE\b/imu,
    /^\s*COPY\s+/imu,
    /^\s*MERGE\s+INTO\b/imu
  ]) {
    assert.doesNotMatch(artifact, forbidden);
  }
}

assert.match(preflight, /117/u);
assert.match(preflight, /104/u);
assert.match(preflight, /13/u);
assert.match(preflight, /category_total <> 16/u);
assert.match(preflight, /authority schema is not fully absent/u);
assert.match(preflight, /catalog_products\.base_price numeric/u);
assert.match(preflight, /has_schema_privilege/u);

assert.match(postApply, /table_count <> 8/u);
assert.match(postApply, /enum_count <> 6/u);
assert.match(postApply, /policy_count <> 24/u);
assert.match(postApply, /authority_rows <> 0/u);
assert.match(postApply, /trigger_count <> 11/u);
assert.match(postApply, /menu_collection_products_collection_id_section_id_sort_order_id/u);

assert.doesNotMatch(rollback, /\bCASCADE\b/iu);
assert.match(rollback, /P22C-3C-ROLLBACK-FINAL-APPROVAL/u);
assert.match(rollback, /rollback is permitted only before P22C-3D data creation/u);
assert.match(rollback, /DROP TABLE public\.menu_collections;/u);
assert.doesNotMatch(rollback, /DROP TABLE public\.catalog_products/iu);
assert.doesNotMatch(rollback, /DROP TABLE public\.product_categories/iu);
assert.doesNotMatch(rollback, /ALTER TABLE public\.catalog_products/iu);
assert.doesNotMatch(rollback, /ALTER TABLE public\.product_categories/iu);

assert.match(compare, /Product counts or fingerprint changed/u);
assert.match(compare, /Category authority or fingerprint changed/u);
assert.match(compare, /tables: 8/u);
assert.match(compare, /rows: 0/u);

for (const marker of [
  "PREPARATION ONLY",
  "separate final approval",
  "MENU_AUTHORITY_MODE=compatibility",
  "117 / 104 ACTIVE / 13 DRAFT / 16 categories",
  "Snapshot",
  "Preflight",
  "Rollback",
  "P22C-3D",
  "P22C-3E",
  "No Production connection was made"
]) {
  assert.ok(documentation.includes(marker), `Missing documentation marker: ${marker}`);
}

console.log("SALORA P22C-3C Production DDL gate preparation verified:");
console.log("- certified migration SHA is unchanged");
console.log("- snapshot, preflight, and post-apply probes are read only");
console.log("- rollback is explicit, non-CASCADE, approval-gated, and empty-data only");
console.log("- product/category fingerprints must remain unchanged");
console.log("- Production execution remains disabled pending separate final approval");
