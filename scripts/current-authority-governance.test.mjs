import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const retired = [
  "apps/web/app/api/control-tower/p36-activate117/route.ts",
  "apps/web/app/api/control-tower/p36-production-data-prep/route.ts",
  "apps/web/components/control-tower/P36ActivationReview.tsx",
  "apps/web/components/control-tower/SimpleLaunchOperationsCenter.tsx",
  "apps/web/lib/control-tower/p36ActivationManifest.ts",
  "apps/web/lib/server/p36Activate117.ts",
  "apps/web/lib/server/p36ProductionDataPrep.ts"
];
for (const path of retired) assert.equal(existsSync(path), false, `Retired P36 runtime path returned: ${path}`);

const catalog = read("apps/web/components/control-tower/CatalogWorkspace.tsx");
const view = read("apps/web/components/control-tower/ControlTowerView.tsx");
const workspace = read("apps/web/components/control-tower/ProductReadinessWorkspace.tsx");
const route = read("apps/web/app/api/control-tower/simple-launch/products/route.ts");
const repository = read("packages/backend/src/domains/control-tower/repository.ts");
const scripts = JSON.parse(read("package.json")).scripts;
const envExample = read(".env.example");
const productionCertification = read("scripts/p31-production-data-certify.mjs");
const databaseContract = read("scripts/database-authority-contract.mjs");
const dependencyInventory = read("scripts/dependency-audit-inventory.mjs");
const workflow = read(".github/workflows/ci.yml");

assert.doesNotMatch(catalog, /P36|ACTIVATE117|117|v2/u);
assert.doesNotMatch(view, /SimpleLaunchOperationsCenter/u);
assert.doesNotMatch(route, /P36|ACTIVATE117|p36ActivationManifest/u);
assert.match(route, /pagination:\s*\{/u);
assert.match(route, /nextOffset/u);
assert.match(route, /repo\.products\.count/u);
assert.match(repository, /catalogProduct\.count/u);
assert.match(workspace, /while \(pages < 50\)/u);
assert.match(workspace, /pagination\.hasMore/u);
assert.match(workspace, /pagination\.total/u);
assert.match(workspace, /variant\.sku/u);
assert.match(workspace, /source=Catalog DB/u);
assert.doesNotMatch(workspace, /offset=100|mergeProducts|p36-activation-review/u);
assert.equal(scripts["test:authority:current"], "node scripts/current-authority-contract.mjs");
assert.equal(scripts["verify:salora-menu"], scripts["test:authority:current"]);
assert.ok(!Object.keys(scripts).some((key) => /^test:p36/u.test(key)));
assert.ok(Object.keys(scripts).some((key) => key === "archive:test:p36"));
assert.equal(scripts["audit:catalog:database"], "node --experimental-strip-types scripts/database-authority-contract.mjs");
assert.ok(scripts["archive:activate:p22b:staging"] && scripts["archive:certify:p22b:staging"]);
assert.equal(scripts["activate:p22b:staging"], undefined);
assert.equal(scripts["certify:p22b:staging"], undefined);
assert.doesNotMatch(envExample, /SALORA_EXPECTED_(?:TOTAL|ACTIVE)_PRODUCTS=/u);
assert.doesNotMatch(productionCertification, /\b117\b|\b104\b/u);
assert.match(productionCertification, /jsonb_array_length\(r\.snapshot -> 'products'\)/u);
assert.match(databaseContract, /DATABASE_API_REVISION_MATCH/u);
assert.match(databaseContract, /createHash\("sha256"\)/u);
assert.match(databaseContract, /primaryImages\), 1/u);
assert.match(dependencyInventory, /DEPENDENCY_AUDIT_INVENTORY_ONLY/u);
assert.match(workflow, /Inventory High dependency advisories/u);

console.log("Current authority governance verified: dynamic paging, no callable P36 runtime, no fixed live assertions.");
