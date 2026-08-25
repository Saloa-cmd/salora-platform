import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const orderability = readFileSync("apps/web/lib/server/orderability.ts", "utf8");
const publicOrders = readFileSync("apps/web/app/api/orders/route.ts", "utf8");
const controlOrders = readFileSync("apps/web/app/api/control-tower/orders/route.ts", "utf8");
const productsRoute = readFileSync("apps/web/app/api/control-tower/simple-launch/products/route.ts", "utf8");
const supremacy = readFileSync("apps/web/lib/server/supremacyControl.ts", "utf8");
const readinessWorkspace = readFileSync("apps/web/components/control-tower/ProductReadinessWorkspace.tsx", "utf8");
const controlTowerView = readFileSync("apps/web/components/control-tower/ControlTowerView.tsx", "utf8");

assert.match(orderability, /basePrice > 0/);
assert.match(orderability, /currentPrice > 0/);
assert.match(orderability, /MEDIA_NOT_READY/);
assert.match(orderability, /CATEGORY_NOT_READY/);
assert.match(orderability, /OPTIONS_NOT_READY/);
assert.match(orderability, /PRODUCT_NOT_ACTIVE/);
assert.match(orderability, /archivedAt: null, deletedAt: null/);
assert.match(orderability, /normalizeCatalogModifierOptions\(modifier\.options\)\.length > 0/);
assert.match(publicOrders, /await assertCatalogItemsOrderable/);
assert.match(controlOrders, /await assertCatalogItemsOrderable/);
assert.match(productsRoute, /catalogOrderabilitySnapshot/);
assert.match(productsRoute, /readiness: readinessBySlug\.get\(product\.slug\)/);
assert.match(productsRoute, /Price Ready, Media Ready, Category Ready and Options Ready/);
assert.match(supremacy, /where: \{ brandKey: "SALORA", status: "ACTIVE"/);

// P34: readiness must be visible to operators and safe bulk activation must
// route every product back through the P33 server guard.
assert.match(readinessWorkspace, /Product readiness & orderability/);
assert.match(readinessWorkspace, /offset=100/);
assert.match(readinessWorkspace, /activationCandidates/);
assert.match(readinessWorkspace, /Activate ready/);
assert.match(readinessWorkspace, /action: "status"/);
assert.match(readinessWorkspace, /status: "ACTIVE"/);
assert.match(readinessWorkspace, /Price|السعر/);
assert.match(readinessWorkspace, /Media|الصورة/);
assert.match(readinessWorkspace, /Order ready|قابل للطلب/);
assert.match(controlTowerView, /ProductReadinessWorkspace/);
assert.match(controlTowerView, /sectionId === "menu"/);

console.log("P33/P34 orderability and Control Tower readiness regression checks passed.");
