# P22 Runtime Hardening Report

## Scope and baseline

- Repository: `Saloa-cmd/salora-platform`
- Phase 2 branch: `agent/p22-runtime-hardening`
- Approved baseline: `e032684709c736c801f45f0e5df306aa89589663`
- Scope: transaction-client concurrency, distributed rate-limit behavior,
  observability hygiene, CSP, read-only browser smoke coverage, and bounded
  dependency remediation.

This report records repository, test, build, GitHub, and Vercel evidence. It is
not a Production database certification and does not authorize Phase 3.

## PostgreSQL and Prisma concurrency

Read-only Vercel log inspection found 14 occurrences of the `pg` warning about
calling `client.query()` while a client was already executing a query. The
events covered several DB-backed routes and were associated with an older
Production artifact, so the current Production artifact was not assumed fixed.

Repository inspection established the local mechanism:

1. `@prisma/adapter-pg` interactive transactions reserve one `pg.Client`.
2. Four transaction callbacks issued Prisma operations through `Promise.all`.
3. `pg` 8.x warns when another query is queued on that already-active client.

The affected transaction callbacks now await their database calls sequentially:

- menu publication scheduling;
- menu publication rollback;
- the WhatsApp command-center transaction;
- the product-media summary transaction.

Independent top-level operations that obtain separate clients were deliberately
left parallel. The transaction helper now documents the single-client rule.
`scripts/prisma-transaction-concurrency.test.mjs` reproduces overlap with a safe
single-client test double and prevents `Promise.all` from returning to the four
transaction scopes. It opens no database connection.

## Distributed rate limiting

- Removed the process-local `Map` counter from `proxy.ts`; it could not provide
  consistent limits across serverless instances.
- Retained the existing Redis atomic increment/expiry implementation for Auth,
  AI, Orders, WhatsApp, Stripe, Control Tower, and analytics scopes.
- Added a typed Redis-unavailable error, an outage metric, and explicit
  fail-closed `503` behavior for protected application operations.
- `429` and `503` responses are non-cacheable and expose no Redis cause or
  topology.

Vercel Firewall configuration is not changed by this PR. Network/volumetric
limits remain a separately reviewed administrative action; the application
layer no longer claims a process-local counter is a production control.

## Tracing and logging

The existing OpenTelemetry spans, Sentry integration, request IDs, database
spans, Redis spans, and queue spans remain the single observability stack.
Infrastructure error logging now constructs context from an explicit allowlist,
adds the active correlation identifier, truncates bounded values, and redacts
credentialed URLs, bearer values, and secret-like assignments.

Authorization headers, cookies, tokens, credentials, and arbitrary nested
payloads are not accepted into the structured runtime context.

## Content Security Policy

- Replaced public `script-src 'unsafe-inline'` with a per-request nonce and
  `strict-dynamic` in Production.
- Nonce-protected style elements no longer use `style-src 'unsafe-inline'`.
- The request CSP is forwarded to Next.js so framework scripts receive the same
  nonce, and the response CSP enforces it in the browser.
- App Router pages are dynamic because request-specific nonces cannot be safely
  attached to statically generated HTML.
- Supabase product-media and Sentry connectivity remain narrow allowlist entries.
- `style-src-attr 'unsafe-inline'` remains an isolated compatibility exception
  for existing React style props and is recorded as deferred debt.

An actual local Production build response for `/login` contained 16 framework
script tags; every tag matched the response nonce, and `script-src` did not
contain `unsafe-inline`.

## Browser smoke coverage

Playwright now validates desktop Chromium and Pixel 7 viewports:

- `/api/health` is exactly `{ "status": "ok" }`, non-cacheable, and `nosniff`;
- `/login` renders, focuses the email input, has no horizontal overflow, and
  enforces matching CSP nonces without browser errors;
- `/` and `/menu` are read-only Preview checks and run only when an explicit
  `PLAYWRIGHT_BASE_URL` is supplied.

Local browser download was blocked by the execution environment returning an
empty CDN response. Test discovery passed, and GitHub Actions installs Chromium
and executes the suite after the Production-equivalent build. No Production HTTP
smoke was run.

## Dependency security

The initial audit reported `30 High / 29 Moderate / 3 Low / 0 Critical`.
Next.js and `eslint-config-next` were updated from resolved `16.2.6` to the
patched `16.2.11` release. The resulting audit is
`23 High / 24 Moderate / 3 Low / 0 Critical`, with no remaining Next.js
advisory.

Remaining findings are transitive across Sharp, Expo/React Native, Prisma
development tooling, ESLint tooling, and their parsers/archive utilities.
Sharp remains relevant to image optimization, but its remediation requires a
separately tested parent/major compatibility decision. No broad override or mass
upgrade was introduced to make the audit appear green.

## Validation evidence

- Node `22.23.1`, pnpm `11.7.0`, frozen-lockfile install: PASS
- Lint: PASS
- Web and mobile TypeScript: PASS
- Full repository test script: PASS
- Prisma single-client concurrency regression: PASS
- Runtime security/CSP/log-redaction regression: PASS
- Distributed rate-limit regression: PASS
- Next.js `16.2.11` Production build: PASS
- Build route inspection: PASS
- Local read-only HTTP health/login assertions: PASS
- `git diff --check`: PASS
- Dependency audit: WARN, `0 Critical`; remaining debt documented above
- Playwright test discovery: PASS
- Local Playwright browser execution: BLOCKED by browser CDN in the execution
  environment; GitHub CI is authoritative for browser execution

## Remaining risks and deferred work

- Confirm the removed transaction overlap warning remains absent after a future
  separately approved Production deployment; this PR does not deploy manually.
- Add organization-approved Vercel Firewall rules without duplicating the Redis
  application policy.
- Remove the isolated style-attribute CSP exception after converting dynamic
  style props to nonce-compatible classes or CSS custom-property patterns.
- Remediate Sharp and Expo/React-Native dependency chains in bounded follow-up
  upgrades with mobile and image-optimization regression coverage.
- Tune CI security tooling only when it adds stable signal and does not create a
  merge deadlock.

## Production safety attestation

- NO PRODUCTION DATABASE WRITE PERFORMED.
- NO PRODUCTION MIGRATION / DDL / DML PERFORMED.
- NO PRODUCTION SNAPSHOT OR PREFLIGHT PERFORMED.
- NO MENU REVISION PUBLISHED.
- NO MENU AUTHORITY MODE ACTIVATED.
- NO PRODUCTION ENVIRONMENT OR SECRET MUTATION PERFORMED.
- NO MANUAL PRODUCTION DEPLOYMENT, PROMOTE, REDEPLOY, OR ROLLBACK PERFORMED.
