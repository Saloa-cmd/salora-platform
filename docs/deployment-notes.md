# Deployment Notes

## Web on Vercel

- Root command from monorepo: `pnpm install`.
- Build command: `pnpm --filter @salora/web build`.
- Output: Next.js default.
- Add production environment variables only when Phase 2 services are connected.

## Mobile with Expo / EAS

- Run locally: `pnpm --filter @salora/mobile start`.
- Configure EAS project before production builds.
- Add icons, splash screens, bundle IDs, and store metadata before submission.

## Environment Placeholders

- `NEXT_PUBLIC_SALORA_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_CLOUD_API_TOKEN`

## Production Reminders

- No secret keys in mobile or public web bundles.
- Validate WhatsApp and payment flows with real accounts only in Phase 2.
- Add monitoring, error reporting, and analytics before launch.
