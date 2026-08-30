# SALORA Admin Email Password Reset

The Production owner account is bound to `mohd2esoo@gmail.com`. The application flow is server-only and uses an opaque one-time token stored as a SHA-256-keyed Redis entry for 15 minutes.

## Runtime configuration

Configure these values in Vercel Production only:

- `RESEND_API_KEY` — sensitive server-only Resend key.
- `SALORA_PASSWORD_RESET_FROM` — verified sender, for example `SALORA <security@salora.cafe>`.
- `NEXT_PUBLIC_SALORA_SITE_URL` — canonical HTTPS site origin used for the reset link.

Never expose the Resend key with a `NEXT_PUBLIC_` prefix. A verified sending domain is required for the custom sender.

## Security behavior

- Request responses do not disclose whether an account exists.
- Distributed rate limits apply to the IP and a SHA-256 digest of the normalized email.
- Reset tokens are 256-bit random values, expire after 15 minutes, and are consumed atomically once.
- The token travels in the URL fragment so it is not sent to Vercel request logs or in HTTP referrers.
- Passwords are hashed with the existing Argon2 policy.
- Every active refresh session is revoked after a successful reset; existing access tokens retain only their configured short TTL.
- Request and completion events are recorded in Activity Log; completion is also recorded in Audit Log.
- Email delivery failure removes the reserved token.

No Prisma migration, RLS policy, index, or database schema change is required.
