# SALORA Phase 1 Auth Foundation

Date: 2026-05-31

## Scope

Implemented the safe PostgreSQL + Prisma + auth foundation only. Stripe, WhatsApp Cloud API, and AI providers are intentionally out of scope.

## Database

- Prisma schema: `prisma/schema.prisma`
- Migration: `prisma/migrations/202605310001_auth_foundation/migration.sql`
- Seed roles: `prisma/seed-auth-foundation.sql`

Tables:

- `users`
- `roles`
- `user_roles`
- `sessions`

Enums:

- `RoleName`: `CUSTOMER`, `STAFF`, `MANAGER`, `ADMIN`
- `SessionStatus`: `ACTIVE`, `REVOKED`, `EXPIRED`

## Auth Runtime

- Password hashing uses Node `scrypt` with per-password salts.
- JWT access and refresh tokens use HS256 with separate secrets.
- Refresh tokens are persisted by hash only.
- Refresh token rotation revokes the old session before issuing a new one.
- RBAC is role and permission based.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/rbac-check`

## Environment

Required for production auth:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `AUTH_ACCESS_TTL_SECONDS`
- `AUTH_REFRESH_TTL_DAYS`

Development can use `AUTH_USE_MEMORY_STORE=true` for local auth flow testing without PostgreSQL. Production must use PostgreSQL.

## Current Prisma Note

Prisma 7 generated client is present under `apps/web/generated/prisma`. Runtime PostgreSQL connection requires completing the approved Prisma PostgreSQL adapter installation in the target deployment environment. Schema, migrations, repository boundary, and API contracts are in place.
