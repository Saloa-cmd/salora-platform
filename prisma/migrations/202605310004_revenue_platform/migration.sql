CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE "OrderPaymentState" AS ENUM ('UNPAID', 'PAYMENT_PENDING', 'PAID', 'PAYMENT_FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

ALTER TABLE "cafe_orders" ADD COLUMN "payment_state" "OrderPaymentState" NOT NULL DEFAULT 'UNPAID';

CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "customer_id" UUID,
  "provider" VARCHAR(80) NOT NULL,
  "provider_payment_id" VARCHAR(160),
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,3) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "idempotency_key" VARCHAR(160) NOT NULL,
  "metadata" JSONB,
  "authorized_at" TIMESTAMPTZ(6),
  "paid_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "canceled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_intents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "provider_payment_intent_id" VARCHAR(160),
  "client_secret_reference" VARCHAR(160),
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,3) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refunds" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "provider_refund_id" VARCHAR(160),
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(10,3) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "reason" VARCHAR(180),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID,
  "provider" VARCHAR(80) NOT NULL,
  "provider_event_id" VARCHAR(160) NOT NULL,
  "event_type" VARCHAR(120) NOT NULL,
  "processing_status" "ProviderProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "related_order_id" UUID,
  "processed_at" TIMESTAMPTZ(6),
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_method_references" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "method_type" VARCHAR(80) NOT NULL,
  "reference" VARCHAR(160) NOT NULL,
  "card_brand" VARCHAR(40),
  "card_last4" VARCHAR(4),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_method_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID,
  "action" VARCHAR(120) NOT NULL,
  "actor_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_reconciliation_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payment_id" UUID NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "gross_amount" DECIMAL(10,3) NOT NULL,
  "net_amount" DECIMAL(10,3) NOT NULL,
  "fee_amount" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "settlement_id" VARCHAR(160),
  "reconciled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_reconciliation_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider", "provider_event_id");
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");
CREATE INDEX "payments_provider_provider_payment_id_idx" ON "payments"("provider", "provider_payment_id");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payment_intents_payment_id_idx" ON "payment_intents"("payment_id");
CREATE INDEX "payment_intents_provider_provider_payment_intent_id_idx" ON "payment_intents"("provider", "provider_payment_intent_id");
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");
CREATE INDEX "refunds_provider_provider_refund_id_idx" ON "refunds"("provider", "provider_refund_id");
CREATE INDEX "refunds_status_idx" ON "refunds"("status");
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");
CREATE INDEX "payment_events_related_order_id_idx" ON "payment_events"("related_order_id");
CREATE INDEX "payment_events_processing_status_idx" ON "payment_events"("processing_status");
CREATE INDEX "payment_method_references_payment_id_idx" ON "payment_method_references"("payment_id");
CREATE INDEX "payment_audit_logs_payment_id_idx" ON "payment_audit_logs"("payment_id");
CREATE INDEX "payment_audit_logs_action_idx" ON "payment_audit_logs"("action");
CREATE INDEX "payment_reconciliation_records_payment_id_idx" ON "payment_reconciliation_records"("payment_id");
CREATE INDEX "payment_reconciliation_records_provider_idx" ON "payment_reconciliation_records"("provider");

ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_method_references" ADD CONSTRAINT "payment_method_references_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_audit_logs" ADD CONSTRAINT "payment_audit_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_reconciliation_records" ADD CONSTRAINT "payment_reconciliation_records_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
