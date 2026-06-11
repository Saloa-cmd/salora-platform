import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(join(root, "prisma/migrations/202605310002_core_business_domains/migration.sql"), "utf8");
const analysis = readFileSync(join(root, "docs/domain-architecture-review.md"), "utf8");

for (const model of [
  "CustomerProfile",
  "CatalogProduct",
  "CafeOrder",
  "Ingredient",
  "LoyaltyAccount",
  "Notification"
]) {
  assert.ok(schema.includes(`model ${model}`), `schema should include ${model}`);
}

for (const table of [
  "customer_profiles",
  "catalog_products",
  "cafe_orders",
  "ingredients",
  "loyalty_accounts",
  "notifications"
]) {
  assert.ok(migration.includes(`\"${table}\"`), `migration should include ${table}`);
}

for (const section of ["Executive Domain Analysis", "Event Architecture", "API Governance", "AI Readiness"]) {
  assert.ok(analysis.includes(section), `domain analysis should include ${section}`);
}

console.log("Business domain tests passed.");
