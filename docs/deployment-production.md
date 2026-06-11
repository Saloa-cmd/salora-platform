# SALORA Production Deployment Notes

Date: 2026-05-31

## Runtime

- Node.js `>=22 <23`.
- pnpm `9.15.0` for the current SALORA lockfile.
- Web build command: `pnpm build`.
- Web start command: `pnpm start:web`.

## Release Gates

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm release:check` against a started production server.

## Environment

Use `.env.example` as the production template. Required before live commerce:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DIAGNOSTICS_TOKEN`
- `SENTRY_DSN` and `OTEL_*` after observability provider approval

## Rollback

Keep the previous deployment active until `/api/live`, `/api/ready`, `/api/health`, and customer ordering flows pass on the candidate.

