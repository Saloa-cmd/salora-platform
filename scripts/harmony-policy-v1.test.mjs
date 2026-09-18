import assert from "node:assert/strict";import fs from "node:fs";
const migration=fs.readFileSync("prisma/migrations/202609180004_harmony_policy_v1/migration.sql","utf8"),p=fs.readFileSync("packages/backend/src/domains/loyalty/persistence.ts","utf8"),m=fs.readFileSync("apps/mobile/app/loyalty.tsx","utf8");
assert.match(migration,/points_per_omr/);assert.match(migration,/HARMONY_V1/);assert.match(migration,/HARMONY_DRINK/);assert.match(migration,/HARMONY_PREMIUM/);
assert.match(p,/harmony_reward_policies/);assert.match(p,/Math\.floor\(amountOmr\*rate\)/);assert.doesNotMatch(p,/return Math\.floor\(amountOmr\);/);
assert.doesNotMatch(m,/Signature drink reward/);assert.doesNotMatch(m,/Harmony VIP experience/);console.log("Harmony policy v1 checks passed.");