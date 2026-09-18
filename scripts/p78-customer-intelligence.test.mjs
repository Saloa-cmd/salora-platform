import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const intelligence=readFileSync("packages/backend/src/analytics/customer/intelligence.ts","utf8");
assert.match(intelligence,/withPrismaAuthContext/);
assert.match(intelligence,/public\.payments/);
assert.match(intelligence,/public\.cafe_orders/);
assert.match(intelligence,/public\.loyalty_accounts/);
assert.match(intelligence,/public\.order_items/);
assert.match(intelligence,/public\.product_categories/);
assert.match(intelligence,/NEW.*REGULAR.*VIP.*AT_RISK.*DORMANT/);
assert.match(intelligence,/lifecycleReason/);
assert.match(intelligence,/60\+ days/);
assert.match(intelligence,/21\+ days/);
assert.match(intelligence,/10\+ visits or 75\+ OMR/);
assert.doesNotMatch(intelligence,/phone|email|birth_month|notes/i);
console.log("P78-B customer intelligence contract checks passed.");
