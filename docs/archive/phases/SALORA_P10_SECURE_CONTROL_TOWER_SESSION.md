# SALORA P10 — Secure Control Tower Session

## Outcome

- Control Tower APIs now accept the same secure HttpOnly access cookie used by protected pages.
- Bearer authentication remains available for trusted API clients.
- Browser clients never need to copy access tokens into local storage.
- Control Tower requests refresh an expired session once and retry the original request.
- The Experience Studio displays a localized recovery action when a session or role is invalid.

## Security model

- Access and refresh tokens remain HttpOnly, `SameSite=Lax`, secure production cookies.
- Bearer tokens take precedence when explicitly supplied by a trusted API client.
- Refresh is attempted only after HTTP 401 and only once, preventing retry loops.
- HTTP 403 remains a definitive RBAC denial and is never bypassed by refresh.

## Verification

- Full SALORA test suite passed.
- Web ESLint passed.
- Next.js production build passed.
- Auth foundation test guards browser-cookie support.

## Production acceptance

1. Sign in as the SALORA administrator.
2. Open `/control-tower/content`.
3. Confirm Experience Studio loads without `Unauthorized`.
4. Save a draft, reload the page, and confirm its version increases.
5. Publish only after reviewing the live preview.
