import assert from "node:assert/strict";
import {
  createHash
} from "node:crypto";
import {
  readFileSync
} from "node:fs";
import {
  resolve
} from "node:path";

const root = process.cwd();

const migrationPath = resolve(
  root,
  "prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql"
);

const documentationPath = resolve(
  root,
  "docs/P22C3A_PRODUCTION_AUTHORITY_SCHEMA_ONLY.md"
);

const manifestPath = resolve(
  root,
  "docs/P22C3A_PRODUCTION_AUTHORITY_SCHEMA_ONLY_MANIFEST.json"
);

const schemaPath = resolve(
  root,
  "prisma/schema.prisma"
);

const packagePath = resolve(
  root,
  "package.json"
);

const migration = readFileSync(
  migrationPath,
  "utf8"
);

const documentation = readFileSync(
  documentationPath,
  "utf8"
);

const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8")
);

const schema = readFileSync(
  schemaPath,
  "utf8"
);

const packageJson = JSON.parse(
  readFileSync(packagePath, "utf8")
);

const sha256 = (value) =>
  createHash("sha256")
    .update(value, "utf8")
    .digest("hex");

assert.equal(
  manifest.migration.sha256,
  sha256(migration),
  "Manifest migration SHA-256 does not match the generated SQL."
);

assert.equal(
  manifest.phase,
  "P22C-3A"
);

assert.equal(
  manifest.mode,
  "REPOSITORY_ONLY_SCHEMA_BUILD"
);

assert.equal(
  manifest.baseCommit,
  "56ce7cfacf3a6c65e4792296498785d4c9985269"
);

assert.equal(
  manifest.productionProjectRef,
  "grcycqdtjjfklibutfos"
);

const requiredTables = [
  "menu_collections",
  "menu_collection_sections",
  "menu_collection_products",
  "product_nutrition_profiles",
  "product_allergen_profiles",
  "menu_collection_revisions",
  "menu_publications",
  "menu_role_permissions"
];

for (const table of requiredTables) {
  assert.match(
    migration,
    new RegExp(`CREATE TABLE "${table}"`),
    `${table} is missing from P22C-3A.`
  );

  assert.match(
    migration,
    new RegExp(
      `ALTER TABLE public\\."?${table}"? ENABLE ROW LEVEL SECURITY`,
      "i"
    ),
    `${table} does not enable RLS.`
  );
}

assert.equal(
  (
    migration.match(
      /^\s*CREATE\s+TABLE\s+"/gmi
    ) ?? []
  ).length,
  8,
  "P22C-3A must create exactly eight authority tables."
);

const requiredEnums = [
  "MenuCollectionKind",
  "MenuCollectionStatus",
  "MenuMembershipSource",
  "FoodDataVerificationStatus",
  "MenuPublicationStatus",
  "MenuCollectionPermission"
];

for (const enumName of requiredEnums) {
  assert.match(
    migration,
    new RegExp(`CREATE TYPE "${enumName}" AS ENUM`),
    `${enumName} is missing.`
  );
}

assert.equal(
  (
    migration.match(
      /^\s*CREATE\s+TYPE\s+"/gmi
    ) ?? []
  ).length,
  6,
  "P22C-3A must create exactly six authority enum types."
);

assert.equal(
  (
    migration.match(
      /^\s*CREATE\s+POLICY\s+"/gmi
    ) ?? []
  ).length,
  24,
  "P22C-3A must contain the 24 final RLS policies."
);

assert.match(
  migration,
  /CREATE POLICY "menu_role_permissions_admin_insert"/
);

assert.match(
  migration,
  /CREATE POLICY "menu_role_permissions_admin_update"/
);

assert.match(
  migration,
  /CREATE POLICY "menu_role_permissions_admin_delete"/
);

assert.doesNotMatch(
  migration,
  /CREATE POLICY "menu_role_permissions_admin_write"/,
  "The superseded all-operation admin policy must not be created."
);

assert.match(
  migration,
  /P22C3A_PRODUCTION_SCHEMA_ONLY_PREFLIGHT/
);

for (const prerequisite of [
  "catalog_products.id uuid",
  "catalog_products.status ProductStatus",
  "public.salora_jwt_roles()",
  "public.salora_is_staff()",
  "public.salora_is_manager()",
  "public.salora_is_admin()",
  "auth.role()"
]) {
  assert.ok(
    migration.includes(prerequisite),
    `Preflight prerequisite is missing: ${prerequisite}`
  );
}

assert.doesNotMatch(
  migration,
  /\bSECURITY\s+DEFINER\b/i,
  "P22C-3A authority functions must not use SECURITY DEFINER."
);

assert.match(
  migration,
  /\bSECURITY\s+INVOKER\b/i
);

assert.match(
  migration,
  /membership\.product_id\s*=\s*product_nutrition_profiles\.product_id/
);

assert.match(
  migration,
  /membership\.product_id\s*=\s*product_allergen_profiles\.product_id/
);

assert.doesNotMatch(
  migration,
  /membership\.product_id\s*=\s*product_id\b/,
  "Food-profile RLS must correlate to the outer profile row."
);

const prohibitedDataStatements = [
  /\bINSERT\s+INTO\b/i,
  /^\s*UPDATE\s+(?!OF\b)/gmi,
  /\bDELETE\s+FROM\b/i,
  /^\s*TRUNCATE\b/gmi,
  /^\s*MERGE\s+INTO\b/gmi,
  /^\s*COPY\s+/gmi
];

for (const pattern of prohibitedDataStatements) {
  assert.doesNotMatch(
    migration,
    pattern,
    `P22C-3A contains prohibited data DML: ${pattern}`
  );
}

for (const pattern of [
  /\bALTER\s+TABLE\s+(?:public\.)?"?catalog_products"?/i,
  /\bALTER\s+TABLE\s+(?:public\.)?"?product_categories"?/i,
  /\bDROP\s+TABLE\b/i,
  /\b(?:CREATE|ALTER)\s+TABLE\s+(?:public\.)?"?staging_certification_metadata"?/i,
  /\b(?:CREATE|ALTER)\s+TABLE\s+(?:public\.)?"?staging_menu_authority_metadata"?/i,
  /\bprice_omr\b/i,
  /\bbase_price\b/i,
  /\bMENU_AUTHORITY_MODE\b/i
]) {
  assert.doesNotMatch(
    migration,
    pattern,
    `P22C-3A violates a Production boundary: ${pattern}`
  );
}

assert.equal(
  (
    migration.match(
      /^\s*BEGIN\s*;/gmi
    ) ?? []
  ).length,
  1
);

assert.equal(
  (
    migration.match(
      /^\s*COMMIT\s*;/gmi
    ) ?? []
  ).length,
  1
);

assert.ok(
  migration.indexOf("BEGIN;") <
    migration.lastIndexOf("COMMIT;"),
  "Transaction boundaries are invalid."
);

for (const model of [
  "MenuCollection",
  "MenuCollectionSection",
  "MenuCollectionProduct",
  "ProductNutritionProfile",
  "ProductAllergenProfile",
  "MenuCollectionRevision",
  "MenuPublication",
  "MenuRolePermission"
]) {
  assert.match(
    schema,
    new RegExp(`model ${model} \\{`),
    `${model} is missing from the existing Prisma schema.`
  );
}

assert.equal(
  packageJson.scripts[
    "test:p22c3a-production-schema"
  ],
  "node scripts/p22c3a-production-schema-only.test.mjs"
);

assert.match(
  packageJson.scripts.test,
  /p22c3a-production-schema-only\.test\.mjs/
);

for (const marker of [
  "FULL_AUTHORITY_SCHEMA_ABSENT",
  "117 / 104 / 13 / 16",
  "compatibility",
  "No migration was applied",
  "P22C-3B",
  "P22C-3C",
  "RLS correlation"
]) {
  assert.ok(
    documentation.includes(marker),
    `Documentation marker is missing: ${marker}`
  );
}

console.log(
  "SALORA P22C-3A repository-only schema build verified:"
);

console.log(
  "- eight authority tables and six enum types are present"
);

console.log(
  "- 24 final RLS policies are present"
);

console.log(
  "- permission seed and all other data DML are absent"
);

console.log(
  "- legacy catalog tables and price columns are untouched"
);

console.log(
  "- nutrition/allergen RLS correlation is explicit"
);

console.log(
  "- no database connection or migration execution occurred"
);
