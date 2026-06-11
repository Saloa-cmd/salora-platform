-- SALORA Control Tower Supremacy v4.0 commercial launch support.
-- Additive-only: enum value additions and a new draft table.

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

ALTER TYPE "PromotionStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PromotionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TYPE "RuntimeConfigScope" ADD VALUE IF NOT EXISTS 'PAYMENTS';
ALTER TYPE "RuntimeConfigScope" ADD VALUE IF NOT EXISTS 'INSTAGRAM';
ALTER TYPE "RuntimeConfigScope" ADD VALUE IF NOT EXISTS 'PROVIDERS';
ALTER TYPE "RuntimeConfigScope" ADD VALUE IF NOT EXISTS 'OBSERVABILITY';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductMediaDraftStatus') THEN
    CREATE TYPE "ProductMediaDraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "product_media_drafts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "status" "ProductMediaDraftStatus" NOT NULL DEFAULT 'DRAFT',
  "source" VARCHAR(40) NOT NULL DEFAULT 'manual',
  "storage_bucket" VARCHAR(120) NOT NULL DEFAULT 'product-images',
  "storage_path" TEXT,
  "public_url" TEXT,
  "prompt" TEXT,
  "alt_text" VARCHAR(180),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_primary_candidate" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "reviewed_by" UUID,
  "approved_at" TIMESTAMPTZ(6),
  "rejected_at" TIMESTAMPTZ(6),
  "published_at" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "product_media_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_media_drafts_product_id_status_idx" ON "product_media_drafts"("product_id", "status");
CREATE INDEX IF NOT EXISTS "product_media_drafts_status_created_at_idx" ON "product_media_drafts"("status", "created_at");
CREATE INDEX IF NOT EXISTS "product_media_drafts_archived_at_idx" ON "product_media_drafts"("archived_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_media_drafts_product_id_fkey'
  ) THEN
    ALTER TABLE "product_media_drafts"
      ADD CONSTRAINT "product_media_drafts_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
