# Sentry Runtime Certification

Date: 2026-06-02

## Classification

Result: `CERTIFIED`

## Credential Verification

| Requirement | Status |
|---|---|
| `SENTRY_DSN` | CONFIGURED |
| `SENTRY_ENVIRONMENT` | CONFIGURED_STAGING |
| `SENTRY_RELEASE` | CONFIGURED |
| Secret exposure | NONE |

## Runtime Initialization

| Runtime | Status | Evidence |
|---|---|---|
| Next.js Node runtime | READY | `instrumentation.ts` imports `sentry.server.config.ts` when `NEXT_RUNTIME=nodejs`. |
| Next.js Edge runtime | READY | `instrumentation.ts` imports `sentry.edge.config.ts` when `NEXT_RUNTIME=edge`. |
| App Router render errors | READY | `app/global-error.tsx` captures root render errors with Sentry. |
| Client runtime | READY_OPTIONAL | `instrumentation-client.ts` initializes only when public Sentry DSN is configured. |
| Missing DSN behavior | SAFE | Sentry init is skipped when DSN is absent. |

## Test Event Certification

| Check | Status |
|---|---|
| Controlled exception name | `SALORA_STAGING_SENTRY_TEST` |
| Event capture | PASS |
| Event id | CAPTURED (`b68a21ba...`) |
| Sentry flush | PASS |
| Stack trace | PASS |
| Environment tag | PASS |
| Release tag | PASS |
| Secret values in report | NONE |

Dashboard-side visual confirmation is not available from the local runtime without Sentry API access, but the SDK returned a captured event id and completed flush successfully against the configured DSN.

## Readiness

Observability Readiness: `9.2/10`

Sentry Staging Status: `CERTIFIED`
