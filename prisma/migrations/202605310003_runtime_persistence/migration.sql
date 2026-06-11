CREATE TYPE "ConversationChannel" AS ENUM ('WEB', 'MOBILE', 'WHATSAPP', 'FUTURE_VOICE');
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "ConversationMessageStatus" AS ENUM ('RECEIVED', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE "ProviderProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DUPLICATE');

CREATE TABLE "conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "channel" "ConversationChannel" NOT NULL,
  "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
  "customer_id" UUID,
  "customer_phone" VARCHAR(32),
  "order_id" UUID,
  "loyalty_account_id" UUID,
  "ai_correlation_id" VARCHAR(80),
  "metadata" JSONB,
  "retention_until" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "channel" "ConversationChannel" NOT NULL,
  "direction" "MessageDirection" NOT NULL,
  "status" "ConversationMessageStatus" NOT NULL,
  "text_redacted" TEXT,
  "provider" VARCHAR(80),
  "provider_message_id" VARCHAR(160),
  "customer_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "channel_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "channel" "ConversationChannel" NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "external_id" VARCHAR(160),
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6),
  "metadata" JSONB,
  CONSTRAINT "channel_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" VARCHAR(80) NOT NULL,
  "provider_message_id" VARCHAR(160) NOT NULL,
  "channel" "ConversationChannel" NOT NULL,
  "processing_status" "ProviderProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "payload_hash" VARCHAR(128),
  "error_message" TEXT,
  "metadata" JSONB,
  CONSTRAINT "provider_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_evaluation_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "correlation_id" VARCHAR(80) NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "model" VARCHAR(120) NOT NULL,
  "intent" VARCHAR(80) NOT NULL,
  "channel" VARCHAR(80) NOT NULL,
  "overall_score" INTEGER NOT NULL,
  "accuracy_score" INTEGER NOT NULL,
  "recommendation_score" INTEGER NOT NULL,
  "safety_score" INTEGER NOT NULL,
  "latency_score" INTEGER NOT NULL,
  "cost_efficiency_score" INTEGER NOT NULL,
  "latency_ms" INTEGER NOT NULL,
  "estimated_cost" DECIMAL(12,6) NOT NULL,
  "safety_blocked" BOOLEAN NOT NULL DEFAULT false,
  "notes" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_evaluation_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provider_messages_provider_provider_message_id_key" ON "provider_messages"("provider", "provider_message_id");
CREATE INDEX "conversations_channel_status_idx" ON "conversations"("channel", "status");
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");
CREATE INDEX "conversations_customer_phone_idx" ON "conversations"("customer_phone");
CREATE INDEX "conversations_order_id_idx" ON "conversations"("order_id");
CREATE INDEX "conversations_created_at_idx" ON "conversations"("created_at");
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");
CREATE INDEX "conversation_messages_provider_provider_message_id_idx" ON "conversation_messages"("provider", "provider_message_id");
CREATE INDEX "conversation_messages_status_idx" ON "conversation_messages"("status");
CREATE INDEX "conversation_messages_created_at_idx" ON "conversation_messages"("created_at");
CREATE INDEX "channel_sessions_conversation_id_idx" ON "channel_sessions"("conversation_id");
CREATE INDEX "channel_sessions_channel_provider_idx" ON "channel_sessions"("channel", "provider");
CREATE INDEX "channel_sessions_external_id_idx" ON "channel_sessions"("external_id");
CREATE INDEX "provider_messages_channel_processing_status_idx" ON "provider_messages"("channel", "processing_status");
CREATE INDEX "provider_messages_received_at_idx" ON "provider_messages"("received_at");
CREATE INDEX "ai_evaluation_records_correlation_id_idx" ON "ai_evaluation_records"("correlation_id");
CREATE INDEX "ai_evaluation_records_provider_model_idx" ON "ai_evaluation_records"("provider", "model");
CREATE INDEX "ai_evaluation_records_channel_intent_idx" ON "ai_evaluation_records"("channel", "intent");
CREATE INDEX "ai_evaluation_records_created_at_idx" ON "ai_evaluation_records"("created_at");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "channel_sessions" ADD CONSTRAINT "channel_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
