import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2);

assert.ok(
  beforePath && afterPath,
  "Usage: node scripts/p22c3c/compare-snapshots.mjs <before.json> <after.json>"
);

const readJson = (path) => {
  const text = readFileSync(path, "utf8").trim();
  assert.ok(text, `Snapshot is empty: ${path}`);
  return JSON.parse(text);
};

const before = readJson(beforePath);
const after = readJson(afterPath);

assert.equal(before.phase, "P22C-3C");
assert.equal(before.mode, "PRODUCTION_SNAPSHOT_READ_ONLY");
assert.equal(after.phase, "P22C-3C");
assert.equal(after.mode, "POST_APPLY_VERIFY_READ_ONLY");

assert.deepEqual(
  after.catalog.products,
  before.catalog.products,
  "Product counts or fingerprint changed during P22C-3C."
);

assert.deepEqual(
  after.catalog.categories,
  before.catalog.categories,
  "Category authority or fingerprint changed during P22C-3C."
);

assert.deepEqual(
  after.authority,
  {
    tables: 8,
    enums: 6,
    policies: 24,
    rlsEnabledTables: 8,
    functions: 7,
    triggers: 11,
    rows: 0,
    identifierMaxBytes: 63,
    identifierCollisions: 0
  }
);

console.log("P22C-3C snapshot comparison PASS:");
console.log("- product authority and fingerprint preserved");
console.log("- category authority and fingerprint preserved");
console.log("- 8 tables / 6 enums / 24 policies / 0 rows verified");
console.log("- PostgreSQL identifier normalization remains collision-free");
