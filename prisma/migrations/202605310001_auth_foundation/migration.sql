CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "RoleName" AS ENUM ('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN');
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "email_verified_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" "RoleName" NOT NULL UNIQUE,
  "description" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "assigned_by" UUID,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token_hash" TEXT NOT NULL UNIQUE,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "ip_address" VARCHAR(64),
  "user_agent" TEXT,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_status_idx" ON "sessions"("status");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

INSERT INTO "roles" ("name", "description") VALUES
  ('CUSTOMER', 'Default customer role for SALORA ordering experiences.'),
  ('STAFF', 'Cafe staff role for operational workflows.'),
  ('MANAGER', 'Manager role for catalog, staff, and operational oversight.'),
  ('ADMIN', 'Administrative role for platform governance.');
