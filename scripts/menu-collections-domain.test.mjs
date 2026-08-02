import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../prisma/migrations/202608020001_menu_collections_domain_foundation/migration.sql", import.meta.url),
  "utf8"
);
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const backendIndex = readFileSync(new URL("../packages/backend/src/index.ts", import.meta.url), "utf8");
const policy = readFileSync(
  new URL("../packages/backend/src/domains/menu-collections/policy.ts", import.meta.url),
  "utf8"
);
const service = readFileSync(
  new URL("../packages/backend/src/domains/menu-collections/service.ts", import.meta.url),
  "utf8"
);
const seed = readFileSync(new URL("../prisma/seed.salora-menu.ts", import.meta.url), "utf8");

const requiredModels = [
  "MenuCollection",
  "MenuCollectionSection",
  "MenuCollectionProduct",
  "ProductNutritionProfile",
  "ProductAllergenProfile",
  "MenuCollectionRevision",
  "MenuPublication",
  "MenuRolePermission"
];

for (const model of requiredModels) {
  assert.match(schema, new RegExp(`model ${model} \\{`), `${model} is missing from Prisma schema.`);
}

for (const enumName of [
  "MenuCollectionKind",
  "MenuCollectionStatus",
  "MenuMembershipSource",
  "FoodDataVerificationStatus",
  "MenuPublicationStatus",
  "MenuCollectionPermission"
]) {
  assert.match(schema, new RegExp(`enum ${enumName} \\{`), `${enumName} is missing from Prisma schema.`);
}

assert.match(schema, /@@unique\(\[collectionId, productId\]\)/);
assert.match(schema, /productId\s+String\s+@unique\s+@map\("product_id"\)/);
assert.match(schema, /activeRevisionId\s+String\?\s+@unique/);
assert.match(schema, /collectionMemberships\s+MenuCollectionProduct\[\]/);
assert.match(schema, /nutritionProfile\s+ProductNutritionProfile\?/);
assert.match(schema, /allergenProfile\s+ProductAllergenProfile\?/);

for (const table of [
  "menu_collections",
  "menu_collection_sections",
  "menu_collection_products",
  "product_nutrition_profiles",
  "product_allergen_profiles",
  "menu_collection_revisions",
  "menu_publications",
  "menu_role_permissions"
]) {
  assert.match(migration, new RegExp(`CREATE TABLE "${table}"`), `${table} migration is missing.`);
  assert.match(
    migration,
    new RegExp(`ALTER TABLE public\\."?${table}"? ENABLE ROW LEVEL SECURITY`, "i"),
    `${table} RLS enablement is missing.`
  );
}

assert.match(migration, /salora_menu_has_permission/);
assert.match(migration, /salora_prevent_menu_revision_mutation/);
assert.match(migration, /salora_enforce_menu_collection_transition/);
assert.match(migration, /REVIEW_FOOD_SAFETY/);
assert.match(migration, /menu_collections_public_read/);
assert.match(migration, /product_nutrition_profiles_public_verified_read/);
assert.match(migration, /product_allergen_profiles_public_verified_read/);

for (const dangerousPattern of [
  /INSERT\s+INTO\s+(?:public\.)?"?catalog_products"?/i,
  /UPDATE\s+(?:public\.)?"?catalog_products"?/i,
  /DELETE\s+FROM\s+(?:public\.)?"?catalog_products"?/i,
  /TRUNCATE\s+(?:TABLE\s+)?(?:public\.)?"?catalog_products"?/i,
  /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?"?catalog_products"?/i,
  /INSERT\s+INTO\s+(?:public\.)?"?product_categories"?/i,
  /UPDATE\s+(?:public\.)?"?product_categories"?/i,
  /DELETE\s+FROM\s+(?:public\.)?"?product_categories"?/i,
  /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?"?product_categories"?/i
]) {
  assert.doesNotMatch(migration, dangerousPattern, "P21 migration must not mutate the authoritative catalog.");
}

assert.match(policy, /MANAGER: \["VIEW", "EDIT", "REVIEW_CONTENT", "REVIEW_FOOD_SAFETY"\]/);
assert.match(policy, /ADMIN: \["VIEW", "EDIT", "REVIEW_CONTENT", "REVIEW_FOOD_SAFETY", "APPROVE", "PUBLISH", "ROLLBACK"\]/);
assert.match(policy, /PUBLISHED: \["PAUSED", "ARCHIVED"\]/);
assert.match(policy, /NUTRITION_REVIEW_INCOMPLETE/);
assert.match(policy, /ALLERGEN_REVIEW_INCOMPLETE/);

assert.match(service, /checksumSnapshot/);
assert.match(service, /createRevision/);
assert.match(service, /schedulePublication/);
assert.match(service, /rollbackPublication/);
assert.match(service, /database\.auditLog\.create/);
assert.match(backendIndex, /domains\/menu-collections/);

assert.equal(
  packageJson.scripts["test:menu-collections-domain"],
  "node --experimental-strip-types scripts/menu-collections-domain.test.mjs"
);
assert.match(packageJson.scripts.test, /menu-collections-domain\.test\.mjs/);

const categoryBlock = seed.match(/const categories = \[([\s\S]*?)\n\] as const;/u)?.[1] ?? "";
const menuBlock = seed.match(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u)?.[1] ?? "";
const categories = [...categoryBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\],?$/gmu)];
const products = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)];

assert.equal(categories.length, 16, "P21 must preserve the 16-category source catalog.");
assert.equal(products.length, 117, "P21 must preserve all 117 source products.");

console.log("SALORA P21 domain foundation verified:");
console.log("- one authoritative 117-product catalog preserved");
console.log("- menu collections reference products without cloning");
console.log("- nutrition and allergen provenance contracts present");
console.log("- immutable revisions, publication rollback, RLS and permission separation present");
console.log("- no production database operation was executed");
