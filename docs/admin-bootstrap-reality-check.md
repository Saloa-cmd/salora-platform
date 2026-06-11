# Admin Bootstrap Reality Check

Date: 2026-06-06
Workspace: `C:\dev\salora-platform`

## Findings

| Question | Evidence-Based Answer |
|---|---|
| Does SALORA currently contain an Admin Bootstrap implementation? | YES. |
| Which file executes it? | `scripts/bootstrap-admin.mjs`. |
| Which package script invokes it? | Root `package.json` has `bootstrap:admin`: `node --experimental-strip-types scripts/bootstrap-admin.mjs`. |
| Which environment variables are required? | `SALORA_ADMIN_BOOTSTRAP_ENABLED`, `SALORA_ADMIN_BOOTSTRAP_EMAIL`, `SALORA_ADMIN_BOOTSTRAP_NAME`, `SALORA_ADMIN_BOOTSTRAP_PASSWORD`, plus runtime `DATABASE_URL`. |
| Is it invoked automatically on startup? | NO. Search found no startup hook invoking `bootstrap:admin` or `scripts/bootstrap-admin.mjs`; it is manual/operator-triggered. |
| Does it create users in Supabase? | YES, when run with required env vars and a working `DATABASE_URL`. It uses Prisma via `getPrismaClient()` and `prisma.user.upsert()`. |
| What table receives the admin user? | Prisma model `User`, mapped to PostgreSQL table `users` via `@@map("users")`. Role assignment is written to `user_roles`; role data is in `roles`. |
| Does an ADMIN account already exist? | NO. Read-only Prisma query returned `users=0`, `roles=4`, `adminUsers=0`, `managerUsers=0`. |

## Implementation Evidence

`scripts/bootstrap-admin.mjs`:

- Loads `.env` if present.
- Requires `SALORA_ADMIN_BOOTSTRAP_ENABLED === "true"`.
- Requires `SALORA_ADMIN_BOOTSTRAP_EMAIL`.
- Requires `SALORA_ADMIN_BOOTSTRAP_NAME`.
- Requires `SALORA_ADMIN_BOOTSTRAP_PASSWORD`.
- Rejects passwords shorter than 16 characters.
- Hashes the password with `hashPassword()`.
- Upserts the `ADMIN` role.
- Upserts a `User`.
- Upserts a `UserRole` connection.
- Writes `RuntimeConfiguration` key `admin.password_rotation_required.<userId>`.
- Writes `ActivityLog` action `admin.bootstrap`.
- Writes an `AuditLog` create/update record.

## Startup Invocation Evidence

Root `package.json` scripts include:

- `dev:web`
- `start:web`
- `build:web`
- `lint:web`
- `build`
- `lint`
- `test`
- `bootstrap:admin`
- `test:go-live`
- `release:check`
- `dev:mobile`
- `typecheck`

None of the startup/build/dev scripts chain `bootstrap:admin`.

## Database Evidence

Read-only Prisma query result:

```json
{
  "users": 0,
  "roles": 4,
  "adminUsers": 0,
  "managerUsers": 0
}
```

No email addresses, passwords, tokens, or database URLs were printed.

## If Bootstrap Were Missing

Bootstrap is not missing. If it were missing, the exact files that would need implementation would be:

- `scripts/bootstrap-admin.mjs`
- root `package.json` script entry `bootstrap:admin`
- existing auth hashing dependency in `apps/web/lib/server/auth/crypto.ts`
- existing Prisma runtime connection in `packages/backend/src/database/prisma.ts`

## Final Status

`ADMIN_BOOTSTRAP_IMPLEMENTED`
