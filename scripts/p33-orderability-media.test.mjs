import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const orderability = readFileSync("apps/web/lib/server/orderability.ts", "utf8");
const publicOrders = readFileSync("apps/web/app/api/orders/route.ts", "utf8");
const controlOrders = readFileSync("apps/web/app/api/control-tower/orders/route.ts", "utf8");
const supremacy = readFileSync("apps/web/lib/server/supremacyControl.ts", "utf8");

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
assert.match(supremacy, /where: \{ brandKey: "SALORA", status: "ACTIVE"/);

console.log("P33 orderability regression checks passed.");
