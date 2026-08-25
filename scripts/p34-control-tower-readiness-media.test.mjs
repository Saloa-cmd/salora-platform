import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspace = readFileSync("apps/web/components/control-tower/ProductReadinessWorkspace.tsx", "utf8");
const view = readFileSync("apps/web/components/control-tower/ControlTowerView.tsx", "utf8");
const productRoute = readFileSync("apps/web/app/api/control-tower/simple-launch/products/route.ts", "utf8");
const orderability = readFileSync("apps/web/lib/server/orderability.ts", "utf8");

assert.match(workspace, /Price Ready|السعر/);
assert.match(workspace, /Media Ready|الصورة/);
assert.match(workspace, /Order ready|قابل للطلب/);
assert.match(workspace, /activationCandidates/);
assert.match(workspace, /action: "status"/);
assert.match(workspace, /status: "ACTIVE"/);
assert.match(workspace, /offset=100/);
assert.match(workspace, /Activate ready|تفعيل الجاهز/);

assert.match(view, /ProductReadinessWorkspace/);
assert.match(view, /sectionId === "menu"/);

assert.match(productRoute, /catalogOrderabilitySnapshot/);
assert.match(productRoute, /Product cannot be activated until Price Ready, Media Ready, Category Ready and Options Ready are all satisfied/);
assert.match(orderability, /priceReady/);
assert.match(orderability, /mediaReady/);
assert.match(orderability, /optionsReady/);
assert.match(orderability, /orderReady/);

console.log("P34 Control Tower readiness and safe bulk activation regression checks passed.");
