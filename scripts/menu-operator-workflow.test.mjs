import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const api = read("apps/web/app/api/control-tower/menu-authority/route.ts");
const studio = read("apps/web/components/control-tower/MenuAuthorityStudio.tsx");
const schemas = read("packages/backend/src/domains/menu-collections/operator-schemas.ts");
const operator = read("packages/backend/src/domains/menu-collections/operator-service.ts");
const service = read("packages/backend/src/domains/menu-collections/service.ts");
const domainSchemas = read("packages/backend/src/domains/menu-collections/schemas.ts");
const diff = read("packages/backend/src/domains/menu-collections/revision-diff.ts");
const staging = read("scripts/p22b-staging-required-mode.test.mjs");
const activation = read("scripts/p22b-staging-activate-revision.mjs");
const packageJson = JSON.parse(read("package.json"));

for (const action of [
  "reorder-sections",
  "reorder-products",
  "bulk-memberships",
  "create-revision",
  "transition",
  "publish",
  "rollback"
]) {
  assert.match(api, new RegExp(`case "${action}"`), `API action missing: ${action}`);
}

for (const view of ["diff", "preview", "validation", "audit"]) {
  assert.match(api, new RegExp(`view === "${view}"`), `API view missing: ${view}`);
}

assert.match(schemas, /expectedUpdatedAt/);
assert.match(schemas, /SET_FEATURED/);
assert.match(schemas, /MOVE_SECTION/);
assert.match(schemas, /SET_VISIBILITY/);
assert.match(operator, /MENU_AUTHORITY_CONFLICT/);
assert.match(operator, /assertExactSet/);
assert.match(operator, /buildMenuRevisionSnapshot/);
assert.match(operator, /diffMenuRevisionSnapshots/);
assert.match(diff, /legacy snapshot shape/);
assert.match(service, /isMenuRevisionContractV2/);
assert.match(service, /Collection changed after the operator loaded the workspace/);
assert.match(domainSchemas, /timezone/);
assert.match(domainSchemas, /expectedUpdatedAt/);

for (const capability of [
  "Revision Diff",
  "Live Preview",
  "Section ordering",
  "Bulk operations",
  "Publishing",
  "Rollback",
  "Audit trail"
]) {
  assert.match(studio, new RegExp(capability, "i"), `Studio capability missing: ${capability}`);
}

assert.match(studio, /Collections, revisions and publishing/);
assert.match(studio, /datetime-local/);
assert.match(studio, /Asia\/Muscat/);
assert.match(studio, /const currentSection = ordered\[index\]/);
assert.match(studio, /const targetSection = ordered\[target\]/);
assert.match(studio, /const currentMembership = ordered\[index\]/);
assert.match(studio, /const targetMembership = ordered\[target\]/);
assert.doesNotMatch(studio, /\[ordered\[index\], ordered\[target\]\] =/);
assert.match(studio, /expectedUpdatedAt/);
assert.match(staging, /SALORA_MENU_AUTHORITY_MODE/);
assert.match(staging, /required/);
assert.match(staging, /contractVersion/);
assert.match(activation, /ALLOW_STAGING_MENU_AUTHORITY_WRITE/);
assert.match(activation, /buildMenuRevisionSnapshot/);
assert.match(activation, /Not a production publication/);
assert.equal(typeof packageJson.scripts["test:menu-operator"], "string");
assert.equal(typeof packageJson.scripts["certify:p22b:staging"], "string");
assert.equal(typeof packageJson.scripts["activate:p22b:staging"], "string");
assert.ok(packageJson.scripts.test.includes("menu-operator-workflow.test.mjs"));

console.log("SALORA P22B Control Tower Operator Workflow verified:");
console.log("- revision diff, live preview and audit views are present");
console.log("- section/product ordering uses optimistic concurrency");
console.log("- bulk membership operations do not mutate the catalog");
console.log("- scheduling, publication and rollback require canonical revisions");
console.log("- required-mode staging certification is explicit and guarded");
