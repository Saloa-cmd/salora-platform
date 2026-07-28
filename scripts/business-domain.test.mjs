import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migration = readFileSync(join(root, "prisma/migrations/202605310002_core_business_domains/migration.sql"), "utf8");
const analysis = readFileSync(join(root, "docs/domain-architecture-review.md"), "utf8");
const orderControl = readFileSync(join(root, "apps/web/lib/server/supremacyControl.ts"), "utf8");
const webCheckout = readFileSync(join(root, "apps/web/components/menu/MenuExperience.tsx"), "utf8");
const mobileCheckout = readFileSync(join(root, "apps/mobile/app/checkout.tsx"), "utf8");

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

assert.match(orderControl, /brandKey: "SALORA", status: "ACTIVE"/, "Orders must resolve active products inside the isolated SALORA catalog.");
assert.match(orderControl, /pricingRules: true/, "Orders must load authoritative pricing rules.");
assert.match(orderControl, /availabilityRules: true/, "Orders must validate authoritative availability rules.");
assert.match(orderControl, /resolveSelections\(item\.modifiers \?\? \[\], product\)/, "Orders must resolve modifier prices on the server.");
assert.doesNotMatch(webCheckout, /unitPrice: line\.unitPrice/, "Web checkout must not submit a client-authored unit price.");
assert.doesNotMatch(mobileCheckout, /unitPrice: item\.unitPrice/, "Mobile checkout must not submit a client-authored unit price.");
assert.match(webCheckout, /productSlug: line\.product\.id/, "Web checkout must submit the catalog product identity.");
assert.match(mobileCheckout, /productSlug: item\.product\.id/, "Mobile checkout must submit the catalog product identity.");

console.log("Business domain tests passed.");
