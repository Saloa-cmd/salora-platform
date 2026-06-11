CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OrderChannel" AS ENUM ('WEB', 'MOBILE', 'STAFF');
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'ADJUSTMENT', 'CONSUMPTION', 'WASTE', 'RETURN');
CREATE TYPE "LoyaltyEntryType" AS ENUM ('EARN', 'REDEEM', 'ADJUST', 'EXPIRE');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

CREATE TABLE "customer_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "display_name" VARCHAR(120),
  "phone" VARCHAR(32),
  "birth_month" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "customer_addresses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL REFERENCES "customer_profiles"("id") ON DELETE CASCADE,
  "type" "AddressType" NOT NULL DEFAULT 'HOME',
  "label" VARCHAR(80),
  "line_1" VARCHAR(180) NOT NULL,
  "line_2" VARCHAR(180),
  "city" VARCHAR(80) NOT NULL,
  "country" VARCHAR(80) NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "customer_preferences" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL REFERENCES "customer_profiles"("id") ON DELETE CASCADE,
  "key" VARCHAR(80) NOT NULL,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  UNIQUE ("customer_id", "key")
);

CREATE TABLE "product_categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" VARCHAR(120) NOT NULL UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "catalog_products" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL REFERENCES "product_categories"("id"),
  "slug" VARCHAR(140) NOT NULL UNIQUE,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "base_price" DECIMAL(10,3) NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "pairing_hint" TEXT,
  "ai_descriptor" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "product_variants" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "name" VARCHAR(120) NOT NULL, "price_delta" DECIMAL(10,3) NOT NULL DEFAULT 0, "sku" VARCHAR(80) UNIQUE);
CREATE TABLE "product_addons" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "name" VARCHAR(120) NOT NULL, "price" DECIMAL(10,3) NOT NULL);
CREATE TABLE "product_modifiers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "name" VARCHAR(120) NOT NULL, "options" JSONB NOT NULL, "required" BOOLEAN NOT NULL DEFAULT false);
CREATE TABLE "pricing_rules" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "name" VARCHAR(120) NOT NULL, "starts_at" TIMESTAMPTZ(6), "ends_at" TIMESTAMPTZ(6), "price" DECIMAL(10,3) NOT NULL);
CREATE TABLE "availability_rules" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "day_of_week" INTEGER, "starts_at" VARCHAR(8), "ends_at" VARCHAR(8), "is_available" BOOLEAN NOT NULL DEFAULT true);

CREATE TABLE "customer_favorites" ("customer_id" UUID NOT NULL REFERENCES "customer_profiles"("id") ON DELETE CASCADE, "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(), PRIMARY KEY ("customer_id", "product_id"));
CREATE TABLE "saved_orders" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" UUID NOT NULL REFERENCES "customer_profiles"("id") ON DELETE CASCADE, "product_id" UUID NOT NULL REFERENCES "catalog_products"("id") ON DELETE CASCADE, "name" VARCHAR(120) NOT NULL, "quantity" INTEGER NOT NULL DEFAULT 1, "modifiers" JSONB);

CREATE TABLE "cafe_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID REFERENCES "customer_profiles"("id"),
  "channel" "OrderChannel" NOT NULL DEFAULT 'WEB',
  "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
  "subtotal" DECIMAL(10,3) NOT NULL,
  "total" DECIMAL(10,3) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'OMR',
  "customer_name" VARCHAR(120),
  "customer_phone" VARCHAR(32),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "order_items" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL REFERENCES "cafe_orders"("id") ON DELETE CASCADE, "product_id" UUID REFERENCES "catalog_products"("id"), "product_name" VARCHAR(160) NOT NULL, "quantity" INTEGER NOT NULL, "unit_price" DECIMAL(10,3) NOT NULL, "total_price" DECIMAL(10,3) NOT NULL, "modifiers" JSONB);
CREATE TABLE "order_timeline" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL REFERENCES "cafe_orders"("id") ON DELETE CASCADE, "status" "OrderStatus" NOT NULL, "message" TEXT, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());
CREATE TABLE "order_notes" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL REFERENCES "cafe_orders"("id") ON DELETE CASCADE, "note" TEXT NOT NULL, "is_staff" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());

CREATE TABLE "suppliers" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "name" VARCHAR(160) NOT NULL, "contact_name" VARCHAR(120), "phone" VARCHAR(32));
CREATE TABLE "ingredients" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "supplier_id" UUID REFERENCES "suppliers"("id"), "name" VARCHAR(160) NOT NULL, "unit" VARCHAR(32) NOT NULL, "current_stock" DECIMAL(12,3) NOT NULL DEFAULT 0, "reorder_threshold" DECIMAL(12,3) NOT NULL DEFAULT 0);
CREATE TABLE "stock_movements" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "ingredient_id" UUID NOT NULL REFERENCES "ingredients"("id") ON DELETE CASCADE, "type" "StockMovementType" NOT NULL, "quantity" DECIMAL(12,3) NOT NULL, "reason" TEXT, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());
CREATE TABLE "consumption_records" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "ingredient_id" UUID NOT NULL REFERENCES "ingredients"("id") ON DELETE CASCADE, "order_id" UUID, "quantity" DECIMAL(12,3) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());

CREATE TABLE "loyalty_accounts" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" UUID NOT NULL UNIQUE REFERENCES "customer_profiles"("id") ON DELETE CASCADE, "points" INTEGER NOT NULL DEFAULT 0, "tier" VARCHAR(40) NOT NULL DEFAULT 'CLASSIC');
CREATE TABLE "loyalty_ledger_entries" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "account_id" UUID NOT NULL REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE, "type" "LoyaltyEntryType" NOT NULL, "points" INTEGER NOT NULL, "reason" VARCHAR(180) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());
CREATE TABLE "rewards" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "code" VARCHAR(80) NOT NULL UNIQUE, "name" VARCHAR(140) NOT NULL, "points_cost" INTEGER NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE "reward_redemptions" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "account_id" UUID NOT NULL REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE, "reward_id" UUID NOT NULL REFERENCES "rewards"("id"), "points" INTEGER NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());

CREATE TABLE "notification_templates" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "key" VARCHAR(120) NOT NULL UNIQUE, "channel" "NotificationChannel" NOT NULL, "subject" VARCHAR(180), "body" TEXT NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());
CREATE TABLE "notifications" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" UUID REFERENCES "customer_profiles"("id"), "template_id" UUID REFERENCES "notification_templates"("id"), "channel" "NotificationChannel" NOT NULL, "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED', "recipient" VARCHAR(255) NOT NULL, "payload" JSONB, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());
CREATE TABLE "notification_delivery_logs" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "notification_id" UUID NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE, "status" "NotificationStatus" NOT NULL, "provider" VARCHAR(80), "response" JSONB, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now());

CREATE INDEX "customer_profiles_phone_idx" ON "customer_profiles"("phone");
CREATE INDEX "catalog_products_category_id_idx" ON "catalog_products"("category_id");
CREATE INDEX "catalog_products_status_idx" ON "catalog_products"("status");
CREATE INDEX "cafe_orders_customer_id_idx" ON "cafe_orders"("customer_id");
CREATE INDEX "cafe_orders_status_idx" ON "cafe_orders"("status");
CREATE INDEX "cafe_orders_created_at_idx" ON "cafe_orders"("created_at");
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");
