# SALORA Validation After Cleanup

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Cleanup Reality

No application code cleanup was applied. Validation was run after audit/report generation and after Prisma client generation.

## Command Results

| Command | Result | Evidence |
|---|---:|---|
| `prisma validate --schema prisma/schema.prisma` | PASS | Schema reported valid. |
| `prisma generate --schema prisma/schema.prisma` | PASS | Prisma Client 7.8.0 generated to `packages/backend/src/database/generated` in 2.48s. |
| `prisma migrate status --schema prisma/schema.prisma` | FAIL/UNKNOWN | Loaded schema and Supabase host, then failed with `Schema engine error`; applied live migration state not verified. |
| `pnpm lint` | PASS | Root lint script completed with exit 0. |
| `pnpm typecheck` | PASS | Web and mobile TypeScript checks completed with exit 0. |
| `pnpm test` | PASS | Script tests completed with exit 0. |
| `pnpm build` | PASS | Next.js production build completed successfully. |

## Validation Warnings

- Nested package scripts emitted Node engine warnings because nested pnpm used Node `v24.15.0` while root `package.json` requires `>=22 <23`.
- Test run emitted a Node module type warning for `apps/web/lib/server/auth/crypto.ts` because the package does not declare module type.
- Live Supabase migration status was not proven from this environment.
- The local dev server was unstable in this Codex shell after earlier successful route compilation; production build still passed.

## Build Evidence

- Next.js version observed during build: 16.2.6.
- Build compiled successfully in 109 seconds.
- TypeScript build phase completed in 33.7 seconds.
- 34 static pages were generated.
- Build route table included `/control-tower` and `/control-tower/[section]`.

## Validation Conclusion

The local codebase passes lint, typecheck, tests, Prisma validate, Prisma generate, and production build. Live database migration status remains unverified.
