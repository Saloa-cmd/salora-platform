# SALORA Security Hardening

Date: 2026-05-31

## Implemented

- CSP and browser hardening headers in middleware.
- `x-request-id` propagation.
- In-memory request rate limiting for single-instance protection.
- Zod validation on the order preview API.
- Protected diagnostics and metrics routes in production.
- Expanded env template for auth, data, AI, payments, and observability secrets.

## Production Decisions Required

- Replace the in-memory limiter with Redis-backed distributed limiting before horizontal scaling.
- Decide the final CSP nonce/hash strategy so inline allowances can be removed.
- Add JWT/RBAC only after user, staff, and admin roles are finalized.
- Keep payment, WhatsApp Cloud API, Firebase, Supabase service role, and provider secrets outside public runtime.

