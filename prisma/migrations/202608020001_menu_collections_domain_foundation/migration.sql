-- SALORA P21 — Menu Collections Domain Foundation
-- Repository migration only. Do not apply to production without staging certification and backup.
-- This migration does not mutate catalog products, categories, prices, media, stock, or orders.

BEGIN;

CREATE TYPE "MenuCollectionKind" AS ENUM ('STANDARD', 'WELLNESS', 'KIDS', 'SEASONAL');
CREATE TYPE "MenuCollectionStatus" AS ENUM (
  'DRAFT',
  'CONTENT_REVIEW',
  'FOOD_SAFETY_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED'
);
CREATE TYPE "MenuMembershipSource" AS ENUM ('MANUAL', 'RULE', 'AI_SUGGESTED');
CREATE TYPE "FoodDataVerificationStatus" AS ENUM (
  'MISSING',
  'DRAFT',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
);
CREATE TYPE "MenuPublicationStatus" AS ENUM (
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'ROLLED_BACK',
  'CANCELLED'
);
CREATE TYPE "MenuCollectionPermission" AS ENUM (
  'VIEW',
  'EDIT',
  'REVIEW_CONTENT',
  'REVIEW_FOOD_SAFETY',
  'APPROVE',
  'PUBLISH',
  'ROLLBACK'
);

CREATE TABLE "menu_collections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "brand_key" VARCHAR(40) NOT NULL DEFAULT 'SALORA',
  "key" VARCHAR(80) NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "kind" "MenuCollectionKind" NOT NULL,
  "status" "MenuCollectionStatus" NOT NULL DEFAULT 'DRAFT',
  "name_ar" VARCHAR(160) NOT NULL,
  "name_en" VARCHAR(160) NOT NULL,
  "description_ar" TEXT,
  "description_en" TEXT,
  "accent_tokens" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "cover_media" JSONB,
  "banner" JSONB,
  "channels" TEXT[] NOT NULL DEFAULT ARRAY['WEB','DIGITAL_MENU','MOBILE']::TEXT[],
  "completeness_score" INTEGER NOT NULL DEFAULT 0,
  "active_revision_id" UUID,
  "scheduled_at" TIMESTAMPTZ(6),
  "published_at" TIMESTAMPTZ(6),
  "paused_at" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_collections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_collections_brand_check" CHECK ("brand_key" = 'SALORA'),
  CONSTRAINT "menu_collections_completeness_check" CHECK ("completeness_score" BETWEEN 0 AND 100),
  CONSTRAINT "menu_collections_channels_check" CHECK (cardinality("channels") > 0)
);

CREATE TABLE "menu_collection_sections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "collection_id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "name_ar" VARCHAR(160) NOT NULL,
  "name_en" VARCHAR(160) NOT NULL,
  "description_ar" TEXT,
  "description_en" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "membership_rule" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_collection_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "menu_collection_products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "collection_id" UUID NOT NULL,
  "section_id" UUID,
  "product_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "title_ar_override" VARCHAR(160),
  "title_en_override" VARCHAR(160),
  "description_ar_override" TEXT,
  "description_en_override" TEXT,
  "presentation_image" JSONB,
  "badges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "membership_source" "MenuMembershipSource" NOT NULL DEFAULT 'MANUAL',
  "membership_rule_key" VARCHAR(120),
  "source_reason" TEXT,
  "is_featured" BOOLEAN NOT NULL DEFAULT false,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_collection_products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_collection_products_badges_check" CHECK (cardinality("badges") <= 2)
);

CREATE TABLE "product_nutrition_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "serving_label_ar" VARCHAR(120),
  "serving_label_en" VARCHAR(120),
  "serving_amount" DECIMAL(10,3),
  "serving_unit" VARCHAR(32),
  "calories_kcal" DECIMAL(10,3),
  "protein_g" DECIMAL(10,3),
  "carbohydrates_g" DECIMAL(10,3),
  "total_sugar_g" DECIMAL(10,3),
  "added_sugar_g" DECIMAL(10,3),
  "fat_g" DECIMAL(10,3),
  "saturated_fat_g" DECIMAL(10,3),
  "sodium_mg" DECIMAL(10,3),
  "caffeine_mg" DECIMAL(10,3),
  "plant_based" BOOLEAN,
  "source_type" VARCHAR(80),
  "source_reference" TEXT,
  "recipe_version" VARCHAR(80),
  "verification_status" "FoodDataVerificationStatus" NOT NULL DEFAULT 'MISSING',
  "confidence_score" DECIMAL(5,4),
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "valid_until" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_nutrition_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_nutrition_profiles_nonnegative_check" CHECK (
    ("serving_amount" IS NULL OR "serving_amount" >= 0) AND
    ("calories_kcal" IS NULL OR "calories_kcal" >= 0) AND
    ("protein_g" IS NULL OR "protein_g" >= 0) AND
    ("carbohydrates_g" IS NULL OR "carbohydrates_g" >= 0) AND
    ("total_sugar_g" IS NULL OR "total_sugar_g" >= 0) AND
    ("added_sugar_g" IS NULL OR "added_sugar_g" >= 0) AND
    ("fat_g" IS NULL OR "fat_g" >= 0) AND
    ("saturated_fat_g" IS NULL OR "saturated_fat_g" >= 0) AND
    ("sodium_mg" IS NULL OR "sodium_mg" >= 0) AND
    ("caffeine_mg" IS NULL OR "caffeine_mg" >= 0)
  ),
  CONSTRAINT "product_nutrition_profiles_confidence_check" CHECK (
    "confidence_score" IS NULL OR ("confidence_score" >= 0 AND "confidence_score" <= 1)
  )
);

CREATE TABLE "product_allergen_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "contains_allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "may_contain_allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "declared_free_from" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "ingredient_version" VARCHAR(80),
  "cross_contact_assessment" TEXT,
  "warning_ar" TEXT,
  "warning_en" TEXT,
  "source_type" VARCHAR(80),
  "source_reference" TEXT,
  "verification_status" "FoodDataVerificationStatus" NOT NULL DEFAULT 'MISSING',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "valid_until" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_allergen_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "menu_collection_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "collection_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "MenuCollectionStatus" NOT NULL,
  "snapshot" JSONB NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "change_summary" VARCHAR(500),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_collection_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_collection_revisions_checksum_check" CHECK ("checksum" ~ '^[a-f0-9]{64}$')
);

CREATE TABLE "menu_publications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "collection_id" UUID NOT NULL,
  "revision_id" UUID NOT NULL,
  "publication_key" VARCHAR(160) NOT NULL,
  "status" "MenuPublicationStatus" NOT NULL DEFAULT 'SCHEDULED',
  "channels" TEXT[] NOT NULL DEFAULT ARRAY['WEB','DIGITAL_MENU','MOBILE']::TEXT[],
  "scheduled_at" TIMESTAMPTZ(6),
  "started_at" TIMESTAMPTZ(6),
  "published_at" TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "rolled_back_at" TIMESTAMPTZ(6),
  "smoke_test_status" VARCHAR(40),
  "failure_reason" TEXT,
  "rollback_of_id" UUID,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_publications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_publications_channels_check" CHECK (cardinality("channels") > 0)
);

CREATE TABLE "menu_role_permissions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "role_name" "RoleName" NOT NULL,
  "permission" "MenuCollectionPermission" NOT NULL,
  "created_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "menu_role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menu_collections_brand_key_key_key" ON "menu_collections"("brand_key", "key");
CREATE UNIQUE INDEX "menu_collections_brand_key_slug_key" ON "menu_collections"("brand_key", "slug");
CREATE UNIQUE INDEX "menu_collections_active_revision_id_key" ON "menu_collections"("active_revision_id");
CREATE INDEX "menu_collections_brand_key_status_kind_idx" ON "menu_collections"("brand_key", "status", "kind");
CREATE INDEX "menu_collections_status_scheduled_at_idx" ON "menu_collections"("status", "scheduled_at");
CREATE INDEX "menu_collections_archived_at_idx" ON "menu_collections"("archived_at");

CREATE UNIQUE INDEX "menu_collection_sections_collection_id_key_key" ON "menu_collection_sections"("collection_id", "key");
CREATE INDEX "menu_collection_sections_collection_id_sort_order_idx" ON "menu_collection_sections"("collection_id", "sort_order");
CREATE INDEX "menu_collection_sections_archived_at_idx" ON "menu_collection_sections"("archived_at");

CREATE UNIQUE INDEX "menu_collection_products_collection_id_product_id_key" ON "menu_collection_products"("collection_id", "product_id");
CREATE INDEX "menu_collection_products_collection_id_section_id_sort_order_idx" ON "menu_collection_products"("collection_id", "section_id", "sort_order");
CREATE INDEX "menu_collection_products_product_id_idx" ON "menu_collection_products"("product_id");
CREATE INDEX "menu_collection_products_archived_at_idx" ON "menu_collection_products"("archived_at");

CREATE UNIQUE INDEX "product_nutrition_profiles_product_id_key" ON "product_nutrition_profiles"("product_id");
CREATE INDEX "product_nutrition_profiles_verification_status_valid_until_idx" ON "product_nutrition_profiles"("verification_status", "valid_until");
CREATE INDEX "product_nutrition_profiles_archived_at_idx" ON "product_nutrition_profiles"("archived_at");

CREATE UNIQUE INDEX "product_allergen_profiles_product_id_key" ON "product_allergen_profiles"("product_id");
CREATE INDEX "product_allergen_profiles_verification_status_valid_until_idx" ON "product_allergen_profiles"("verification_status", "valid_until");
CREATE INDEX "product_allergen_profiles_archived_at_idx" ON "product_allergen_profiles"("archived_at");

CREATE UNIQUE INDEX "menu_collection_revisions_collection_id_version_key" ON "menu_collection_revisions"("collection_id", "version");
CREATE INDEX "menu_collection_revisions_collection_id_created_at_idx" ON "menu_collection_revisions"("collection_id", "created_at");
CREATE INDEX "menu_collection_revisions_checksum_idx" ON "menu_collection_revisions"("checksum");

CREATE UNIQUE INDEX "menu_publications_publication_key_key" ON "menu_publications"("publication_key");
CREATE INDEX "menu_publications_collection_id_status_scheduled_at_idx" ON "menu_publications"("collection_id", "status", "scheduled_at");
CREATE INDEX "menu_publications_revision_id_idx" ON "menu_publications"("revision_id");
CREATE INDEX "menu_publications_rollback_of_id_idx" ON "menu_publications"("rollback_of_id");

CREATE UNIQUE INDEX "menu_role_permissions_role_name_permission_key" ON "menu_role_permissions"("role_name", "permission");
CREATE INDEX "menu_role_permissions_permission_idx" ON "menu_role_permissions"("permission");

ALTER TABLE "menu_collection_sections"
  ADD CONSTRAINT "menu_collection_sections_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "menu_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "menu_collection_products"
  ADD CONSTRAINT "menu_collection_products_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "menu_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_collection_products"
  ADD CONSTRAINT "menu_collection_products_section_id_fkey"
  FOREIGN KEY ("section_id") REFERENCES "menu_collection_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "menu_collection_products"
  ADD CONSTRAINT "menu_collection_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_nutrition_profiles"
  ADD CONSTRAINT "product_nutrition_profiles_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_allergen_profiles"
  ADD CONSTRAINT "product_allergen_profiles_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "menu_collection_revisions"
  ADD CONSTRAINT "menu_collection_revisions_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "menu_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "menu_collections"
  ADD CONSTRAINT "menu_collections_active_revision_id_fkey"
  FOREIGN KEY ("active_revision_id") REFERENCES "menu_collection_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "menu_publications"
  ADD CONSTRAINT "menu_publications_collection_id_fkey"
  FOREIGN KEY ("collection_id") REFERENCES "menu_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_publications"
  ADD CONSTRAINT "menu_publications_revision_id_fkey"
  FOREIGN KEY ("revision_id") REFERENCES "menu_collection_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "menu_publications"
  ADD CONSTRAINT "menu_publications_rollback_of_id_fkey"
  FOREIGN KEY ("rollback_of_id") REFERENCES "menu_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "menu_role_permissions" ("role_name", "permission")
VALUES
  ('STAFF', 'VIEW'),
  ('MANAGER', 'VIEW'),
  ('MANAGER', 'EDIT'),
  ('MANAGER', 'REVIEW_CONTENT'),
  ('MANAGER', 'REVIEW_FOOD_SAFETY'),
  ('ADMIN', 'VIEW'),
  ('ADMIN', 'EDIT'),
  ('ADMIN', 'REVIEW_CONTENT'),
  ('ADMIN', 'REVIEW_FOOD_SAFETY'),
  ('ADMIN', 'APPROVE'),
  ('ADMIN', 'PUBLISH'),
  ('ADMIN', 'ROLLBACK')
ON CONFLICT ("role_name", "permission") DO NOTHING;

CREATE OR REPLACE FUNCTION public.salora_menu_has_permission(required_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.menu_role_permissions permission_row
      JOIN unnest(public.salora_jwt_roles()) AS jwt_role(role_name)
        ON upper(jwt_role.role_name) = permission_row.role_name::text
      WHERE permission_row.permission::text = required_permission
    );
$$;

CREATE OR REPLACE FUNCTION public.salora_menu_transition_allowed(old_status text, new_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT old_status = new_status OR (old_status, new_status) IN (
    ('DRAFT', 'CONTENT_REVIEW'),
    ('DRAFT', 'ARCHIVED'),
    ('CONTENT_REVIEW', 'DRAFT'),
    ('CONTENT_REVIEW', 'FOOD_SAFETY_REVIEW'),
    ('CONTENT_REVIEW', 'APPROVED'),
    ('CONTENT_REVIEW', 'ARCHIVED'),
    ('FOOD_SAFETY_REVIEW', 'CONTENT_REVIEW'),
    ('FOOD_SAFETY_REVIEW', 'APPROVED'),
    ('FOOD_SAFETY_REVIEW', 'ARCHIVED'),
    ('APPROVED', 'DRAFT'),
    ('APPROVED', 'SCHEDULED'),
    ('APPROVED', 'PUBLISHED'),
    ('APPROVED', 'ARCHIVED'),
    ('SCHEDULED', 'APPROVED'),
    ('SCHEDULED', 'PUBLISHED'),
    ('SCHEDULED', 'PAUSED'),
    ('SCHEDULED', 'ARCHIVED'),
    ('PUBLISHED', 'PAUSED'),
    ('PUBLISHED', 'ARCHIVED'),
    ('PAUSED', 'DRAFT'),
    ('PAUSED', 'PUBLISHED'),
    ('PAUSED', 'ARCHIVED'),
    ('ARCHIVED', 'DRAFT')
  );
$$;

CREATE OR REPLACE FUNCTION public.salora_enforce_menu_collection_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  required_permission text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NOT public.salora_menu_transition_allowed(OLD.status::text, NEW.status::text) THEN
    RAISE EXCEPTION 'Invalid menu collection transition: % -> %', OLD.status, NEW.status;
  END IF;

  required_permission := CASE
    WHEN NEW.status IN ('DRAFT', 'CONTENT_REVIEW') THEN 'EDIT'
    WHEN NEW.status = 'FOOD_SAFETY_REVIEW' THEN 'REVIEW_CONTENT'
    WHEN NEW.status = 'APPROVED' THEN 'APPROVE'
    ELSE 'PUBLISH'
  END;

  IF NOT public.salora_menu_has_permission(required_permission) THEN
    RAISE EXCEPTION 'Menu collection permission % is required for transition to %', required_permission, NEW.status;
  END IF;

  IF NEW.status IN ('APPROVED', 'SCHEDULED', 'PUBLISHED') AND NEW.completeness_score <> 100 THEN
    RAISE EXCEPTION 'Menu collection completeness must be 100 before status %', NEW.status;
  END IF;

  IF NEW.status IN ('SCHEDULED', 'PUBLISHED') AND NEW.active_revision_id IS NULL THEN
    RAISE EXCEPTION 'An active immutable revision is required before status %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.salora_enforce_food_profile_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.verification_status IN ('VERIFIED', 'REJECTED')
    AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM NEW.verification_status)
    AND NOT public.salora_menu_has_permission('REVIEW_FOOD_SAFETY') THEN
    RAISE EXCEPTION 'Food-safety review permission is required for verification status %', NEW.verification_status;
  END IF;

  IF NOT (
    public.salora_menu_has_permission('EDIT')
    OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
  ) THEN
    RAISE EXCEPTION 'Menu edit or food-safety review permission is required';
  END IF;

  IF NEW.verification_status = 'VERIFIED' THEN
    IF NEW.source_type IS NULL OR NEW.source_reference IS NULL OR NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL THEN
      RAISE EXCEPTION 'Verified food data requires source provenance, reviewer, and review timestamp';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.salora_prevent_menu_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Menu collection revisions are immutable; create a new revision instead';
END;
$$;

CREATE OR REPLACE FUNCTION public.salora_validate_active_menu_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.active_revision_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.menu_collection_revisions revision
    WHERE revision.id = NEW.active_revision_id
      AND revision.collection_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Active revision must belong to the same menu collection';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.salora_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER menu_collections_status_guard
BEFORE UPDATE OF status ON public.menu_collections
FOR EACH ROW EXECUTE FUNCTION public.salora_enforce_menu_collection_transition();

CREATE TRIGGER menu_collections_active_revision_guard
BEFORE INSERT OR UPDATE OF active_revision_id ON public.menu_collections
FOR EACH ROW EXECUTE FUNCTION public.salora_validate_active_menu_revision();

CREATE TRIGGER menu_collection_revisions_immutable_update
BEFORE UPDATE ON public.menu_collection_revisions
FOR EACH ROW EXECUTE FUNCTION public.salora_prevent_menu_revision_mutation();

CREATE TRIGGER menu_collection_revisions_immutable_delete
BEFORE DELETE ON public.menu_collection_revisions
FOR EACH ROW EXECUTE FUNCTION public.salora_prevent_menu_revision_mutation();

CREATE TRIGGER product_nutrition_profiles_review_guard
BEFORE INSERT OR UPDATE ON public.product_nutrition_profiles
FOR EACH ROW EXECUTE FUNCTION public.salora_enforce_food_profile_review();

CREATE TRIGGER product_allergen_profiles_review_guard
BEFORE INSERT OR UPDATE ON public.product_allergen_profiles
FOR EACH ROW EXECUTE FUNCTION public.salora_enforce_food_profile_review();

CREATE TRIGGER menu_collections_touch_updated_at
BEFORE UPDATE ON public.menu_collections
FOR EACH ROW EXECUTE FUNCTION public.salora_touch_updated_at();
CREATE TRIGGER menu_collection_sections_touch_updated_at
BEFORE UPDATE ON public.menu_collection_sections
FOR EACH ROW EXECUTE FUNCTION public.salora_touch_updated_at();
CREATE TRIGGER menu_collection_products_touch_updated_at
BEFORE UPDATE ON public.menu_collection_products
FOR EACH ROW EXECUTE FUNCTION public.salora_touch_updated_at();
CREATE TRIGGER product_nutrition_profiles_touch_updated_at
BEFORE UPDATE ON public.product_nutrition_profiles
FOR EACH ROW EXECUTE FUNCTION public.salora_touch_updated_at();
CREATE TRIGGER product_allergen_profiles_touch_updated_at
BEFORE UPDATE ON public.product_allergen_profiles
FOR EACH ROW EXECUTE FUNCTION public.salora_touch_updated_at();

ALTER TABLE public.menu_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_collection_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_allergen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_collection_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_collections_public_read"
ON public.menu_collections
FOR SELECT
TO anon, authenticated
USING (
  (
    status = 'PUBLISHED'
    AND archived_at IS NULL
    AND (published_at IS NULL OR published_at <= now())
  )
  OR public.salora_menu_has_permission('VIEW')
);

CREATE POLICY "menu_collections_editor_insert"
ON public.menu_collections
FOR INSERT
TO authenticated
WITH CHECK (public.salora_menu_has_permission('EDIT'));

CREATE POLICY "menu_collections_editor_update"
ON public.menu_collections
FOR UPDATE
TO authenticated
USING (public.salora_menu_has_permission('EDIT') OR public.salora_menu_has_permission('PUBLISH'))
WITH CHECK (public.salora_menu_has_permission('EDIT') OR public.salora_menu_has_permission('PUBLISH'));

CREATE POLICY "menu_collection_sections_public_read"
ON public.menu_collection_sections
FOR SELECT
TO anon, authenticated
USING (
  (
    archived_at IS NULL
    AND is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.menu_collections collection
      WHERE collection.id = collection_id
        AND collection.status = 'PUBLISHED'
        AND collection.archived_at IS NULL
    )
  )
  OR public.salora_menu_has_permission('VIEW')
);

CREATE POLICY "menu_collection_sections_editor_insert"
ON public.menu_collection_sections
FOR INSERT TO authenticated
WITH CHECK (public.salora_menu_has_permission('EDIT'));

CREATE POLICY "menu_collection_sections_editor_update"
ON public.menu_collection_sections
FOR UPDATE TO authenticated
USING (public.salora_menu_has_permission('EDIT'))
WITH CHECK (public.salora_menu_has_permission('EDIT'));

CREATE POLICY "menu_collection_products_public_read"
ON public.menu_collection_products
FOR SELECT
TO anon, authenticated
USING (
  (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.menu_collections collection
      JOIN public.catalog_products product ON product.id = product_id
      WHERE collection.id = collection_id
        AND collection.status = 'PUBLISHED'
        AND collection.archived_at IS NULL
        AND product.status = 'ACTIVE'
    )
  )
  OR public.salora_menu_has_permission('VIEW')
);

CREATE POLICY "menu_collection_products_editor_insert"
ON public.menu_collection_products
FOR INSERT TO authenticated
WITH CHECK (public.salora_menu_has_permission('EDIT'));

CREATE POLICY "menu_collection_products_editor_update"
ON public.menu_collection_products
FOR UPDATE TO authenticated
USING (public.salora_menu_has_permission('EDIT'))
WITH CHECK (public.salora_menu_has_permission('EDIT'));

CREATE POLICY "product_nutrition_profiles_public_verified_read"
ON public.product_nutrition_profiles
FOR SELECT
TO anon, authenticated
USING (
  (
    verification_status = 'VERIFIED'
    AND archived_at IS NULL
    AND (valid_until IS NULL OR valid_until >= now())
    AND EXISTS (
      SELECT 1
      FROM public.menu_collection_products membership
      JOIN public.menu_collections collection ON collection.id = membership.collection_id
      JOIN public.catalog_products product ON product.id = membership.product_id
      WHERE membership.product_id = product_id
        AND membership.archived_at IS NULL
        AND collection.status = 'PUBLISHED'
        AND collection.archived_at IS NULL
        AND product.status = 'ACTIVE'
    )
  )
  OR public.salora_menu_has_permission('VIEW')
);

CREATE POLICY "product_nutrition_profiles_editor_insert"
ON public.product_nutrition_profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
);

CREATE POLICY "product_nutrition_profiles_editor_update"
ON public.product_nutrition_profiles
FOR UPDATE TO authenticated
USING (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
)
WITH CHECK (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
);

CREATE POLICY "product_allergen_profiles_public_verified_read"
ON public.product_allergen_profiles
FOR SELECT
TO anon, authenticated
USING (
  (
    verification_status = 'VERIFIED'
    AND archived_at IS NULL
    AND (valid_until IS NULL OR valid_until >= now())
    AND EXISTS (
      SELECT 1
      FROM public.menu_collection_products membership
      JOIN public.menu_collections collection ON collection.id = membership.collection_id
      JOIN public.catalog_products product ON product.id = membership.product_id
      WHERE membership.product_id = product_id
        AND membership.archived_at IS NULL
        AND collection.status = 'PUBLISHED'
        AND collection.archived_at IS NULL
        AND product.status = 'ACTIVE'
    )
  )
  OR public.salora_menu_has_permission('VIEW')
);

CREATE POLICY "product_allergen_profiles_editor_insert"
ON public.product_allergen_profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
);

CREATE POLICY "product_allergen_profiles_editor_update"
ON public.product_allergen_profiles
FOR UPDATE TO authenticated
USING (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
)
WITH CHECK (
  public.salora_menu_has_permission('EDIT')
  OR public.salora_menu_has_permission('REVIEW_FOOD_SAFETY')
);

CREATE POLICY "menu_collection_revisions_staff_read"
ON public.menu_collection_revisions
FOR SELECT TO authenticated
USING (public.salora_menu_has_permission('VIEW'));

CREATE POLICY "menu_collection_revisions_reviewer_insert"
ON public.menu_collection_revisions
FOR INSERT TO authenticated
WITH CHECK (
  public.salora_menu_has_permission('REVIEW_CONTENT')
  OR public.salora_menu_has_permission('APPROVE')
);

CREATE POLICY "menu_publications_staff_read"
ON public.menu_publications
FOR SELECT TO authenticated
USING (public.salora_menu_has_permission('VIEW'));

CREATE POLICY "menu_publications_publisher_insert"
ON public.menu_publications
FOR INSERT TO authenticated
WITH CHECK (
  public.salora_menu_has_permission('PUBLISH')
  OR public.salora_menu_has_permission('ROLLBACK')
);

CREATE POLICY "menu_publications_publisher_update"
ON public.menu_publications
FOR UPDATE TO authenticated
USING (
  public.salora_menu_has_permission('PUBLISH')
  OR public.salora_menu_has_permission('ROLLBACK')
)
WITH CHECK (
  public.salora_menu_has_permission('PUBLISH')
  OR public.salora_menu_has_permission('ROLLBACK')
);

CREATE POLICY "menu_role_permissions_staff_read"
ON public.menu_role_permissions
FOR SELECT TO authenticated
USING (public.salora_is_staff());

CREATE POLICY "menu_role_permissions_admin_write"
ON public.menu_role_permissions
FOR ALL TO authenticated
USING (public.salora_is_admin())
WITH CHECK (public.salora_is_admin());

COMMIT;
