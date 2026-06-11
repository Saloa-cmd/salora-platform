CREATE TABLE "whatsapp_webhook_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_event_id" VARCHAR(160),
  "event_type" VARCHAR(80) NOT NULL,
  "processing_status" "ProviderProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "correlation_id" VARCHAR(80) NOT NULL,
  "payload" JSONB NOT NULL,
  "error_message" TEXT,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_webhook_events_provider_event_id_idx" ON "whatsapp_webhook_events"("provider_event_id");
CREATE INDEX "whatsapp_webhook_events_event_type_processing_status_idx" ON "whatsapp_webhook_events"("event_type", "processing_status");
CREATE INDEX "whatsapp_webhook_events_correlation_id_idx" ON "whatsapp_webhook_events"("correlation_id");
CREATE INDEX "whatsapp_webhook_events_received_at_idx" ON "whatsapp_webhook_events"("received_at");
CREATE INDEX "whatsapp_webhook_events_deleted_at_idx" ON "whatsapp_webhook_events"("deleted_at");
