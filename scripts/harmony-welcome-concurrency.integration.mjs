import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {awardPaidOrderLoyalty} from "../packages/backend/src/domains/loyalty/persistence.ts";
import {disconnectPrisma,getPrismaClient} from "../packages/backend/src/database/prisma.ts";

const customerId=randomUUID();
const prisma=getPrismaClient();
await prisma.$executeRawUnsafe("INSERT INTO harmony_reward_policies (id,code,points_per_omr,welcome_bonus_points,is_active,effective_from) VALUES (gen_random_uuid(),'HARMONY_V1',10,20,true,now())");
await prisma.$executeRawUnsafe("INSERT INTO harmony_consents (id,customer_id,consent_type) VALUES (gen_random_uuid(),$1::uuid,'HARMONY_MEMBERSHIP')",customerId);

const attempts=await Promise.all([
 awardPaidOrderLoyalty({customerId,orderId:randomUUID(),paymentId:randomUUID(),amount:1}),
 awardPaidOrderLoyalty({customerId,orderId:randomUUID(),paymentId:randomUUID(),amount:1})
]);
const welcome=await prisma.$queryRawUnsafe("SELECT count(*)::int AS count,coalesce(sum(points),0)::int AS points FROM loyalty_ledger_entries WHERE idempotency_key=$1",`welcome:${customerId}`);
const account=await prisma.$queryRawUnsafe("SELECT points FROM loyalty_accounts WHERE customer_id=$1::uuid",customerId);
assert.equal(attempts.length,2);
assert.equal(welcome[0].count,1);
assert.equal(welcome[0].points,20);
assert.equal(attempts.filter(x=>x?.welcome?.applied).length,1);
assert.equal(attempts.filter(x=>x?.welcome&&!x.welcome.applied).length,1);
assert.equal(account[0].points,40); // two independent 10-point earns + one 20-point welcome bonus
console.log("Harmony application concurrency proof passed: attempts=2 welcome_entries=1 welcome_points=20 duplicate_bonus=0");
await disconnectPrisma();
