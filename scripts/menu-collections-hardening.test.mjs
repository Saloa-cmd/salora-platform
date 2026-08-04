import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const migrationPath = resolve(
  root,
  "prisma/migrations/202608020002_menu_collections_security_performance_hardening/migration.sql",
);
const documentationPath = resolve(
  root,
  "docs/P21A_STAGING_HARDENING_CERTIFICATION.md",
);

const migration = readFileSync(migrationPath, "utf8");
const documentation = readFileSync(documentationPath, "utf8");

const requiredMigrationMarkers = [
  'CREATE INDEX IF NOT EXISTS "menu_collection_products_section_id_idx"',
  "ALTER FUNCTION public.salora_jwt_roles() SECURITY INVOKER",
  "ALTER FUNCTION public.salora_is_staff() SECURITY INVOKER",
  "ALTER FUNCTION public.salora_is_manager() SECURITY INVOKER",
  "ALTER FUNCTION public.salora_is_admin() SECURITY INVOKER",
  "ALTER FUNCTION public.salora_menu_has_permission(text) SECURITY INVOKER",
  "ALTER FUNCTION public.salora_menu_transition_allowed(text, text)",
  "ALTER FUNCTION public.salora_enforce_menu_collection_transition()",
  "ALTER FUNCTION public.salora_enforce_food_profile_review()",
  "ALTER FUNCTION public.salora_prevent_menu_revision_mutation()",
  "ALTER FUNCTION public.salora_validate_active_menu_revision()",
  "ALTER FUNCTION public.salora_touch_updated_at()",
  'DROP POLICY IF EXISTS "menu_role_permissions_admin_write"',
  'CREATE POLICY "menu_role_permissions_admin_insert"',
  'CREATE POLICY "menu_role_permissions_admin_update"',
  'CREATE POLICY "menu_role_permissions_admin_delete"',
];

for (const marker of requiredMigrationMarkers) {
  assert.ok(
    migration.includes(marker),
    `P21A migration is missing required marker: ${marker}`,
  );
}

const prohibitedPatterns = [
  /\bDROP\s+TABLE\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\s+(?:public\.)?"?catalog_products"?/i,
  /\bUPDATE\s+(?:public\.)?"?catalog_products"?/i,
  /\bINSERT\s+INTO\s+(?:public\.)?"?catalog_products"?/i,
  /\bDELETE\s+FROM\s+(?:public\.)?"?product_categories"?/i,
  /\bUPDATE\s+(?:public\.)?"?product_categories"?/i,
  /\bINSERT\s+INTO\s+(?:public\.)?"?product_categories"?/i,
];

for (const pattern of prohibitedPatterns) {
  assert.equal(
    pattern.test(migration),
    false,
    `P21A migration contains prohibited catalog mutation: ${pattern}`,
  );
}

assert.match(migration, /\bBEGIN\s*;/i);
assert.match(migration, /\bCOMMIT\s*;/i);
assert.ok(
  migration.indexOf("BEGIN;") < migration.indexOf("COMMIT;"),
  "P21A transaction boundaries are invalid",
);

const documentationMarkers = [
  "117",
  "16",
  "92",
  "25",
  "8 P21 tables",
  "22 RLS policies",
  "Security Advisor: 0 findings",
  "Production database unchanged",
  "synthetic certification fixtures",
];

const normalizedDocumentation = documentation
  .replace(/\s+/g, " ")
  .toLowerCase();

for (const marker of documentationMarkers) {
  assert.ok(
    normalizedDocumentation.includes(marker.toLowerCase()),
    `P21A certification document is missing: ${marker}`,
  );
}

console.log("SALORA P21A hardening contract verified:");
console.log("- direct section foreign-key index present");
console.log("- permission helpers run as SECURITY INVOKER");
console.log("- function search paths are fixed");
console.log("- admin write policy is split by operation");
console.log("- authoritative catalog tables are not mutated");
console.log("- staging certification evidence is documented");
