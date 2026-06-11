# Sentry Certification

Date: 2026-06-01

## Classification

Result: `BLOCKED`

## Checks

| Check | Result |
|---|---|
| `SENTRY_DSN` | MISSING |
| Exception capture | NOT_RUN |
| Stack trace capture | NOT_RUN |
| Release tagging | NOT_RUN |
| Environment tagging | NOT_RUN |

## Blocker

`CREDENTIAL BLOCKER`

Sentry production error tracking cannot be certified until `SENTRY_DSN` is configured.
