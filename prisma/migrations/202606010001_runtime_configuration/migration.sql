CREATE TYPE "RuntimeConfigScope" AS ENUM (
  'PRICING',
  'PROMOTIONS',
  'LOYALTY',
  'AI_ROUTING',
  'AI_PROVIDER',
  'WHATSAPP',
  'NOTIFICATIONS',
  'FEATURE_FLAGS',
  'HOMEPAGE',
  'APP',
  'RECOMMENDATIONS'
);

CREATE TABLE "runtime_configurations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "RuntimeConfigScope" NOT NULL,
  "key" VARCHAR(140) NOT NULL,
  "value" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" UUID,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "runtime_configurations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "runtime_configurations_scope_key_key" ON "runtime_configurations"("scope", "key");
CREATE INDEX "runtime_configurations_scope_is_active_idx" ON "runtime_configurations"("scope", "is_active");
