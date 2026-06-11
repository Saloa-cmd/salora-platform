# Sentry Redaction Certification

Date: 2026-06-02

## Classification

Result: `CERTIFIED`

## Redaction Controls

| Area | Status | Evidence |
|---|---|---|
| Environment secrets | PASS | Sensitive key names are filtered before event delivery. |
| Request headers | PASS | Authorization, cookie, token, secret, password, and API key headers are redacted. |
| Payment data | PASS | Stripe, card, client secret, and payment method fields are redacted by key pattern. |
| Customer PII | PASS | User context is minimized to id and role only. |
| Payload depth | PASS | Nested context is depth-limited and long strings are truncated. |
| Local missing DSN behavior | PASS | Sentry initialization is skipped when `SENTRY_DSN` is absent. |

## Policy

SALORA Sentry events must not include raw credentials, payment secrets, authorization headers, cookies, refresh tokens, database URLs, Redis URLs, or full customer PII. The configured `beforeSend` sanitizer enforces this policy for server and edge events.
