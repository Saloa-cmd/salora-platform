# Commercial Data Unsafe Generated Migration Quarantine

Date: 2026-06-03

Quarantined migration: `prisma/migrations/202606030001_commercial_data_alignment/migration.sql`

Reason: generated SQL contained broad historical drift normalization outside the approved additive-only commercial launch scope, including existing foreign-key constraint churn and `ALTER COLUMN ... DROP DEFAULT` statements on unrelated tables.

This content was removed from active Prisma migrations and preserved here for review/audit only. It must not be deployed as-is.

## Quarantined SQL

``sql
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT');

-- DropForeignKey
ALTER TABLE "availability_rules" DROP CONSTRAINT "availability_rules_product_id_fkey";

-- DropForeignKey
ALTER TABLE "cafe_orders" DROP CONSTRAINT "cafe_orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "catalog_products" DROP CONSTRAINT "catalog_products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "consumption_records" DROP CONSTRAINT "consumption_records_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_addresses" DROP CONSTRAINT "customer_addresses_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_favorites" DROP CONSTRAINT "customer_favorites_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_favorites" DROP CONSTRAINT "customer_favorites_product_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_preferences" DROP CONSTRAINT "customer_preferences_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_profiles" DROP CONSTRAINT "customer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_accounts" DROP CONSTRAINT "loyalty_accounts_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_ledger_entries" DROP CONSTRAINT "loyalty_ledger_entries_account_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_delivery_logs" DROP CONSTRAINT "notification_delivery_logs_notification_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_template_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "order_notes" DROP CONSTRAINT "order_notes_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_timeline" DROP CONSTRAINT "order_timeline_order_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_rules" DROP CONSTRAINT "pricing_rules_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_addons" DROP CONSTRAINT "product_addons_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_modifiers" DROP CONSTRAINT "product_modifiers_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";

-- DropForeignKey
ALTER TABLE "reward_redemptions" DROP CONSTRAINT "reward_redemptions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "reward_redemptions" DROP CONSTRAINT "reward_redemptions_reward_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_orders" DROP CONSTRAINT "saved_orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_orders" DROP CONSTRAINT "saved_orders_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "ai_evaluation_records" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "availability_rules" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cafe_orders" ADD COLUMN     "discount_total" DECIMAL(10,3) NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "catalog_products" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "channel_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "consumption_records" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversation_messages" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_addresses" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_preferences" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_profiles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ingredients" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "loyalty_accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "loyalty_ledger_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_delivery_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_templates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_notes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_timeline" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_intents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_method_references" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_reconciliation_records" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pricing_rules" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_addons" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_modifiers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_variants" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "provider_messages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refunds" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "reward_redemptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "rewards" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "runtime_configurations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "saved_orders" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stock_movements" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
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
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
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
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "customer_id" UUID,
    "discount_amount" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
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
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "promotion_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id","product_id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" UUID NOT NULL,
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
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendation_records" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
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
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
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

-- CreateIndex
CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_images_deleted_at_idx" ON "product_images"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_starts_at_ends_at_idx" ON "coupons"("is_active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "coupons_deleted_at_idx" ON "coupons"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_order_id_key" ON "coupon_redemptions"("order_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_created_at_idx" ON "coupon_redemptions"("coupon_id", "created_at");

-- CreateIndex
CREATE INDEX "coupon_redemptions_customer_id_coupon_id_idx" ON "coupon_redemptions"("customer_id", "coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_slug_key" ON "promotions"("slug");

-- CreateIndex
CREATE INDEX "promotions_status_starts_at_ends_at_idx" ON "promotions"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "promotions_deleted_at_idx" ON "promotions"("deleted_at");

-- CreateIndex
CREATE INDEX "promotion_products_product_id_idx" ON "promotion_products"("product_id");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_status_idx" ON "product_reviews"("product_id", "status");

-- CreateIndex
CREATE INDEX "product_reviews_customer_id_idx" ON "product_reviews"("customer_id");

-- CreateIndex
CREATE INDEX "product_reviews_deleted_at_idx" ON "product_reviews"("deleted_at");

-- CreateIndex
CREATE INDEX "ai_recommendation_records_customer_id_created_at_idx" ON "ai_recommendation_records"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_recommendation_records_product_id_created_at_idx" ON "ai_recommendation_records"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_recommendation_records_provider_model_idx" ON "ai_recommendation_records"("provider", "model");

-- CreateIndex
CREATE INDEX "feature_flags_environment_enabled_idx" ON "feature_flags"("environment", "enabled");

-- CreateIndex
CREATE INDEX "feature_flags_deleted_at_idx" ON "feature_flags"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_environment_key" ON "feature_flags"("key", "environment");

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "availability_rules_product_id_idx" ON "availability_rules"("product_id");

-- CreateIndex
CREATE INDEX "consumption_records_ingredient_id_idx" ON "consumption_records"("ingredient_id");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "ingredients_supplier_id_idx" ON "ingredients"("supplier_id");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_account_id_idx" ON "loyalty_ledger_entries"("account_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_notification_id_idx" ON "notification_delivery_logs"("notification_id");

-- CreateIndex
CREATE INDEX "notifications_customer_id_idx" ON "notifications"("customer_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_notes_order_id_idx" ON "order_notes"("order_id");

-- CreateIndex
CREATE INDEX "order_timeline_order_id_idx" ON "order_timeline"("order_id");

-- CreateIndex
CREATE INDEX "pricing_rules_product_id_idx" ON "pricing_rules"("product_id");

-- CreateIndex
CREATE INDEX "product_addons_product_id_idx" ON "product_addons"("product_id");

-- CreateIndex
CREATE INDEX "product_modifiers_product_id_idx" ON "product_modifiers"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "reward_redemptions_account_id_idx" ON "reward_redemptions"("account_id");

-- CreateIndex
CREATE INDEX "saved_orders_customer_id_idx" ON "saved_orders"("customer_id");

-- CreateIndex
CREATE INDEX "stock_movements_ingredient_id_idx" ON "stock_movements"("ingredient_id");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_preferences" ADD CONSTRAINT "customer_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifiers" ADD CONSTRAINT "product_modifiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_orders" ADD CONSTRAINT "saved_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_orders" ADD CONSTRAINT "saved_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafe_orders" ADD CONSTRAINT "cafe_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_records" ADD CONSTRAINT "ai_recommendation_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_records" ADD CONSTRAINT "ai_recommendation_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_timeline" ADD CONSTRAINT "order_timeline_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "cafe_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_records" ADD CONSTRAINT "consumption_records_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger_entries" ADD CONSTRAINT "loyalty_ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "notification_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

``

