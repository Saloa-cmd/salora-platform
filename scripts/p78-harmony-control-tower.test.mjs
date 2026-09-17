import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const view=readFileSync("apps/web/components/control-tower/ControlTowerView.tsx","utf8");
const harmony=readFileSync("apps/web/components/control-tower/HarmonyCustomerWorkspace.tsx","utf8");
const loyalty=readFileSync("apps/web/app/api/loyalty/route.ts","utf8");
assert.match(view,/HarmonyCustomerWorkspace/);assert.match(view,/id: "harmony"/);
assert.match(harmony,/NEW/);assert.match(harmony,/REGULAR/);assert.match(harmony,/VIP/);assert.match(harmony,/AT_RISK/);assert.match(harmony,/DORMANT/);
assert.match(harmony,/lifecycleReason/);assert.match(harmony,/loyaltyBalance/);
assert.match(loyalty,/MANAGER/);assert.match(loyalty,/ADMIN/);assert.match(loyalty,/actorId/);assert.match(loyalty,/Idempotency-Key/);
console.log("P78-C Harmony Control Tower foundation checks passed.");