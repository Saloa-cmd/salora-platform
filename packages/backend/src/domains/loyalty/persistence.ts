import { getPrismaClient, withQueryProtection } from "../../database/prisma";
import { incrementMetric } from "../../runtime/metrics";
import { publishDomainEvent } from "../events";

export type PersistentLoyaltyMutation = {
  customerId: string;
  points: number;
  type: "EARN" | "REDEEM" | "ADJUST" | "EXPIRE" | "REVERSAL" | "BONUS";
  reason: string;
  idempotencyKey: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
  metadata?: Record<string, unknown>;
};

export type PersistentLoyaltyResult = {
  accountId: string;
  entryId: string;
  balance: number;
  applied: boolean;
};

type LedgerRow = { id: string; account_id: string; points: number };
type AccountRow = { id: string; points: number };

function signedPoints(input: PersistentLoyaltyMutation): number {
  const magnitude = Math.abs(Math.trunc(input.points));
  if (magnitude === 0) throw new Error("Loyalty mutation must change the balance.");
  if (input.type === "ADJUST") return input.points < 0 ? -magnitude : magnitude;
  return ["REDEEM", "EXPIRE", "REVERSAL"].includes(input.type) ? -magnitude : magnitude;
}

export function calculateHarmonyEarn(amountOmr: number): number {
  if (!Number.isFinite(amountOmr) || amountOmr <= 0) return 0;
  // Centralized v1 rule. P78-C will make this operator-configurable.
  return Math.floor(amountOmr);
}

export async function applyPersistentLoyaltyMutation(input: PersistentLoyaltyMutation): Promise<PersistentLoyaltyResult> {
  const prisma = getPrismaClient();
  const delta = signedPoints(input);
  return withQueryProtection("loyalty.mutate", () => prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRawUnsafe<LedgerRow[]>(
      'SELECT id, account_id, points FROM loyalty_ledger_entries WHERE idempotency_key=$1 LIMIT 1',
      input.idempotencyKey
    );
    if (existing[0]) {
      const account = await tx.$queryRawUnsafe<AccountRow[]>(
        'SELECT id, points FROM loyalty_accounts WHERE id=$1::uuid',
        existing[0].account_id
      );
      return { accountId: existing[0].account_id, entryId: existing[0].id, balance: account[0]?.points ?? 0, applied: false };
    }

    const accounts = await tx.$queryRawUnsafe<AccountRow[]>(
      `INSERT INTO loyalty_accounts (id, customer_id, points, tier, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, 0, 'CLASSIC', now(), now())
       ON CONFLICT (customer_id) DO UPDATE SET updated_at=loyalty_accounts.updated_at
       RETURNING id, points`,
      input.customerId
    );
    const account = accounts[0];
    if (!account) throw new Error("Unable to resolve loyalty account.");

    // Serialize balance changes for this account. Unique idempotency remains the
    // second line of defense for concurrent retries.
    await tx.$queryRawUnsafe('SELECT id FROM loyalty_accounts WHERE id=$1::uuid FOR UPDATE', account.id);

    const current = await tx.$queryRawUnsafe<AccountRow[]>('SELECT id, points FROM loyalty_accounts WHERE id=$1::uuid', account.id);
    const balance = current[0]?.points ?? 0;
    if (balance + delta < 0) throw new Error("Insufficient loyalty balance.");

    const rows = await tx.$queryRawUnsafe<LedgerRow[]>(
      `INSERT INTO loyalty_ledger_entries
       (id, account_id, type, points, reason, order_id, payment_id, refund_id, idempotency_key, metadata, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2::"LoyaltyEntryType", $3, $4, $5::uuid, $6::uuid, $7::uuid, $8, $9::jsonb, now())
       ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING id, account_id, points`,
      account.id, input.type, delta, input.reason, input.orderId ?? null, input.paymentId ?? null,
      input.refundId ?? null, input.idempotencyKey, JSON.stringify(input.metadata ?? {})
    );
    if (!rows[0]) {
      const duplicate = await tx.$queryRawUnsafe<LedgerRow[]>(
        'SELECT id, account_id, points FROM loyalty_ledger_entries WHERE idempotency_key=$1 LIMIT 1',
        input.idempotencyKey
      );
      const latest = await tx.$queryRawUnsafe<AccountRow[]>('SELECT id, points FROM loyalty_accounts WHERE id=$1::uuid', account.id);
      if (!duplicate[0]) throw new Error("Loyalty idempotency conflict could not be resolved.");
      return { accountId: account.id, entryId: duplicate[0].id, balance: latest[0]?.points ?? balance, applied: false };
    }

    const updated = await tx.$queryRawUnsafe<AccountRow[]>(
      'UPDATE loyalty_accounts SET points=points+$2, updated_at=now() WHERE id=$1::uuid RETURNING id, points',
      account.id, delta
    );
    return { accountId: account.id, entryId: rows[0].id, balance: updated[0]?.points ?? balance + delta, applied: true };
  })).then((result) => {
    if (result.applied) {
      incrementMetric("salora_loyalty_persistent_mutations_total");
      publishDomainEvent({
        name: input.type === "REVERSAL" ? "LoyaltyPointsReversed" : "LoyaltyPointsAwarded",
        aggregateId: result.accountId,
        aggregateType: "LoyaltyAccount",
        payload: { entryId: result.entryId, points: delta, orderId: input.orderId, paymentId: input.paymentId, refundId: input.refundId }
      });
    } else {
      incrementMetric("salora_loyalty_idempotent_replays_total");
    }
    return result;
  });
}

export async function awardPaidOrderLoyalty(input: { customerId: string; orderId: string; paymentId: string; amount: number }) {
  const points = calculateHarmonyEarn(input.amount);
  if (points <= 0) return null;
  return applyPersistentLoyaltyMutation({
    customerId: input.customerId,
    points,
    type: "EARN",
    reason: `Paid order ${input.orderId}`,
    idempotencyKey: `payment:${input.paymentId}:earn`,
    orderId: input.orderId,
    paymentId: input.paymentId,
    metadata: { source: "payment_succeeded", amountOmr: input.amount }
  });
}

export async function reverseRefundedLoyalty(input: { customerId: string; orderId: string; paymentId: string; refundId: string; amount: number }) {
  const points = calculateHarmonyEarn(input.amount);
  if (points <= 0) return null;
  return applyPersistentLoyaltyMutation({
    customerId: input.customerId,
    points,
    type: "REVERSAL",
    reason: `Refund for order ${input.orderId}`,
    idempotencyKey: `refund:${input.refundId}:reverse`,
    orderId: input.orderId,
    paymentId: input.paymentId,
    refundId: input.refundId,
    metadata: { source: "refund_succeeded", amountOmr: input.amount }
  });
}
