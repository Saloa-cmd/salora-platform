import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/202609180001_p78_persistent_loyalty_core/migration.sql", "utf8");
const persistence = readFileSync("packages/backend/src/domains/loyalty/persistence.ts", "utf8");
const payment = readFileSync("packages/backend/src/payments/service.ts", "utf8");
const legacyPayment = readFileSync("packages/backend/src/domains/payments/service.ts", "utf8");
const api = readFileSync("apps/web/app/api/loyalty/route.ts", "utf8");

assert.match(schema, /REVERSAL/);
assert.match(schema, /idempotencyKey/);
assert.match(migration, /UNIQUE INDEX IF NOT EXISTS "loyalty_ledger_entries_idempotency_key_key"/);
assert.match(migration, /BEFORE UPDATE OR DELETE/);
assert.match(persistence, /FOR UPDATE/);
assert.match(persistence, /ON CONFLICT \(idempotency_key\)/);
assert.match(persistence, /balance \+ delta < 0/);
assert.match(persistence, /payment:\$\{input\.paymentId\}:earn/);
assert.match(persistence, /refund:\$\{input\.refundId\}:reverse/);
assert.match(payment, /await awardPaidOrderLoyalty/);
assert.match(payment, /await reverseRefundedLoyalty/);
assert.doesNotMatch(legacyPayment, /awardLoyaltyPoints/);
assert.match(api, /Idempotency-Key header is required/);
assert.doesNotMatch(api, /awardLoyaltyPoints/);

console.log("P78-A persistent loyalty contract checks passed.");
