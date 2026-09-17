-- P78-A Persistent Loyalty Core
-- Add durable correlation/idempotency metadata without rewriting historical rows.
ALTER TYPE "LoyaltyEntryType" ADD VALUE IF NOT EXISTS 'REVERSAL';
ALTER TYPE "LoyaltyEntryType" ADD VALUE IF NOT EXISTS 'BONUS';

ALTER TABLE "loyalty_accounts"
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz(6) NOT NULL DEFAULT now();

ALTER TABLE "loyalty_ledger_entries"
  ADD COLUMN IF NOT EXISTS "order_id" uuid,
  ADD COLUMN IF NOT EXISTS "payment_id" uuid,
  ADD COLUMN IF NOT EXISTS "refund_id" uuid,
  ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(200),
  ADD COLUMN IF NOT EXISTS "metadata" jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_ledger_entries_idempotency_key_key"
  ON "loyalty_ledger_entries" ("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "loyalty_ledger_entries_account_id_created_at_idx"
  ON "loyalty_ledger_entries" ("account_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "loyalty_ledger_entries_order_id_idx"
  ON "loyalty_ledger_entries" ("order_id")
  WHERE "order_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "loyalty_ledger_entries_payment_id_idx"
  ON "loyalty_ledger_entries" ("payment_id")
  WHERE "payment_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "loyalty_ledger_entries_refund_id_idx"
  ON "loyalty_ledger_entries" ("refund_id")
  WHERE "refund_id" IS NOT NULL;

-- Correlation IDs intentionally remain non-FK in P78-A because the legacy payment
-- orchestration still contains an ephemeral compatibility store. P78 does not
-- create referential coupling to records that are not yet guaranteed persistent.

-- Ledger history is financial-like history: application roles may append through
-- governed server code, but existing rows must not be mutated/deleted.
CREATE OR REPLACE FUNCTION public.salora_loyalty_ledger_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'loyalty_ledger_entries are append-only; use a reversal entry';
END;
$$;
DROP TRIGGER IF EXISTS loyalty_ledger_immutable ON public.loyalty_ledger_entries;
CREATE TRIGGER loyalty_ledger_immutable
BEFORE UPDATE OR DELETE ON public.loyalty_ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.salora_loyalty_ledger_immutable();
