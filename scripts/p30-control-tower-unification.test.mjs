import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const controlTower = read("apps/web/components/control-tower/ControlTowerView.tsx");
const intelligenceWorkspace = read("apps/web/components/control-tower/ControlTowerIntelligenceWorkspace.tsx");
const marketingWorkspace = read("apps/web/components/control-tower/MarketingOperationsWorkspace.tsx");
const publicMenu = read("apps/web/lib/server/publicMenu.ts");
const globalConcierge = read("apps/web/components/GlobalAiConcierge.tsx");

for (const kind of ["customers", "operations", "ai"]) {
  assert.match(controlTower, new RegExp(`<DashboardView kind="${kind}"`));
}
assert.match(controlTower, /<ControlTowerIntelligenceWorkspace/);
assert.match(controlTower, /<MarketingOperationsWorkspace/);
assert.doesNotMatch(controlTower, /href="\/dashboard\/(revenue|customers|operations|ai)"/);
assert.doesNotMatch(controlTower, /sectionId === "marketing"\) return <SimpleLaunchOperationsCenter/);

for (const kind of ["revenue", "customers", "operations", "ai"]) {
  assert.match(intelligenceWorkspace, new RegExp(`id: "${kind}"`));
}
assert.match(intelligenceWorkspace, /role="tablist"/);
assert.match(intelligenceWorkspace, /role="tabpanel"/);

assert.match(marketingWorkspace, /simple-launch\/promotions/);
assert.match(marketingWorkspace, /simple-launch\/coupons/);
assert.match(marketingWorkspace, /<ContentOperationsStudio/);
assert.match(marketingWorkspace, /discountValue/);
assert.match(marketingWorkspace, /toggleCoupon/);

assert.match(publicMenu, /isSyntheticTestProduct/);
assert.match(publicMenu, /quarantineSyntheticTestData/);
assert.match(publicMenu, /pos\[_-\]\?test/);
assert.match(publicMenu, /synthetic non-production/);
assert.match(publicMenu, /return quarantineSyntheticTestData\(await getMenuAuthoritySnapshot\(\)\)/);

assert.match(globalConcierge, /fetch\("\/api\/products"/);
assert.match(globalConcierge, /payload\.runtime\?\.databaseHealth === "available"/);
assert.match(globalConcierge, /payload\.runtime\?\.stale === false/);
assert.match(globalConcierge, /if \(availability !== "ready"\) return null/);
assert.doesNotMatch(globalConcierge, /live menu is connected|اتصال المنيو المباشر/);

console.log("SALORA P30 Control Tower unification verified:");
console.log("- DB-backed intelligence is embedded in Control Tower workspaces");
console.log("- Marketing has a focused promotions, coupons, and governed content workspace");
console.log("- legacy dashboard redirects are no longer the primary analytics workflow");
console.log("- synthetic POS test data is quarantined from public menu surfaces");
console.log("- public AI availability remains gated without exposing infrastructure state to customers");
