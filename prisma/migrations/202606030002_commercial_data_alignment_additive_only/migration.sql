-- SALORA commercial data alignment additive-only migration.
-- Scope: approved Simple Launch commercial launch objects only.

CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM');
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT');

CREATE TABLE "product_images" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "storage_bucket" VARCHAR(120) NOT NULL DEFAULT 'product-images',
  "storage_path" TEXT NOT NULL,
  "public_url" TEXT,
  "alt_text" VARCHAR(180),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coupons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(140) NOT NULL,
  "description" TEXT,
  "discount_type" "DiscountType" NOT NULL,
  "discount_value" DECIMAL(10,3) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "minimum_order_total" DECIMAL(10,3),
  "max_discount_amount" DECIMAL(10,3),
  "usage_limit" INTEGER,
  "usage_limit_per_customer" INTEGER,
  "starts_at" TIMESTAMPTZ(6),
  "ends_at" TIMESTAMPTZ(6),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coupon_redemptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "coupon_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "customer_id" UUID,
  "discount_amount" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" VARCHAR(140) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
  "starts_at" TIMESTAMPTZ(6),
  "ends_at" TIMESTAMPTZ(6),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "rules" JSONB NOT NULL DEFAULT '{}',
  "metadata" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_products" (
  "promotion_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id","product_id")
);

CREATE TABLE "product_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "customer_id" UUID,
  "order_id" UUID,
  "rating" INTEGER NOT NULL,
  "title" VARCHAR(140),
  "body" TEXT,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_recommendation_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID,
  "product_id" UUID,
  "correlation_id" VARCHAR(80),
  "provider" VARCHAR(80) NOT NULL,
  "model" VARCHAR(120) NOT NULL,
  "intent" VARCHAR(80) NOT NULL DEFAULT 'recommendation',
  "score" INTEGER,
  "accepted" BOOLEAN,
  "context" JSONB,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_recommendation_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature_flags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(140) NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "environment" VARCHAR(40) NOT NULL DEFAULT 'staging',
  "rules" JSONB NOT NULL DEFAULT '{}',
  "created_by" UUID,
  "updated_by" UUID,
  "archived_at" TIMESTAMPTZ(6),
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" UUID,
  "actor_type" VARCHAR(40) NOT NULL DEFAULT 'system',
  "action" VARCHAR(120) NOT NULL,
  "entity_type" VARCHAR(120) NOT NULL,
  "entity_id" UUID,
  "request_id" VARCHAR(80),
  "ip_address" VARCHAR(64),
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" UUID,
  "action" "AuditAction" NOT NULL,
  "entity_type" VARCHAR(120) NOT NULL,
  "entity_id" UUID,
  "before" JSONB,
  "after" JSONB,
  "request_id" VARCHAR(80),
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images"("product_id", "sort_order");
CREATE INDEX "product_images_deleted_at_idx" ON "product_images"("deleted_at");

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_is_active_starts_at_ends_at_idx" ON "coupons"("is_active", "starts_at", "ends_at");
CREATE INDEX "coupons_deleted_at_idx" ON "coupons"("deleted_at");

CREATE UNIQUE INDEX "coupon_redemptions_order_id_key" ON "coupon_redemptions"("order_id");
CREATE INDEX "coupon_redemptions_coupon_id_created_at_idx" ON "coupon_redemptions"("coupon_id", "created_at");
CREATE INDEX "coupon_redemptions_customer_id_coupon_id_idx" ON "coupon_redemptions"("customer_id", "coupon_id");

CREATE UNIQUE INDEX "promotions_slug_key" ON "promotions"("slug");
CREATE INDEX "promotions_status_starts_at_ends_at_idx" ON "promotions"("status", "starts_at", "ends_at");
CREATE INDEX "promotions_deleted_at_idx" ON "promotions"("deleted_at");

CREATE INDEX "promotion_products_product_id_idx" ON "promotion_products"("product_id");

CREATE INDEX "product_reviews_product_id_status_idx" ON "product_reviews"("product_id", "status");
CREATE INDEX "product_reviews_customer_id_idx" ON "product_reviews"("customer_id");
CREATE INDEX "product_reviews_deleted_at_idx" ON "product_reviews"("deleted_at");

CREATE INDEX "ai_recommendation_records_customer_id_created_at_idx" ON "ai_recommendation_records"("customer_id", "created_at");
CREATE INDEX "ai_recommendation_records_product_id_created_at_idx" ON "ai_recommendation_records"("product_id", "created_at");
CREATE INDEX "ai_recommendation_records_provider_model_idx" ON "ai_recommendation_records"("provider", "model");

CREATE INDEX "feature_flags_environment_enabled_idx" ON "feature_flags"("environment", "enabled");
CREATE INDEX "feature_flags_deleted_at_idx" ON "feature_flags"("deleted_at");
CREATE UNIQUE INDEX "feature_flags_key_environment_key" ON "feature_flags"("key", "environment");

CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_recommendation_records" ADD CONSTRAINT "ai_recommendation_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_recommendation_records" ADD CONSTRAINT "ai_recommendation_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
