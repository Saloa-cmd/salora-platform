# SALORA P31 — Production Data Foundation Runbook

## Purpose

Create a dedicated, auditable Production data plane for SALORA without promoting Staging or POS Test into Production and without exposing infrastructure concepts in customer-facing experiences.

## Environment identity

Production identity is resolved from the current Supabase/Vercel providers, never from historical phase documents.

Known non-production Supabase refs are explicitly rejected by P31 certification:

- `grcycqdtjjfklibutfos` — current `salora-staging`
- `errmouqcepkljncoefdd` — `salora-pos-test`

A new dedicated Production Supabase project must receive its own project ref. `SALORA_EXPECTED_SUPABASE_PROJECT_REF` is set only after that project exists.

## Gate 1 — Provision dedicated Production Supabase

1. Choose the authenticated `Salora.Cafe` Supabase organization.
2. Review provider-reported project cost before creation.
3. Create a new project named for Production (recommended: `salora-production`).
4. Record only the project ref in governance documentation. Never commit database passwords, service-role keys, connection strings, JWT secrets, or provider tokens.

## Gate 2 — Schema deployment

The executable Prisma chain is the source of truth. Historical P22C-3A SQL is preserved under `prisma/baselines/` for certification only and is not executable migration history.

For a new Production database:

1. Run provider/project identity guard.
2. Run the repository Prisma migrations in order.
3. Run `pnpm audit:production:preflight` with `SALORA_ENVIRONMENT=production`, the dedicated project ref, and a direct database connection supplied securely at runtime.
4. Any pending migration, project-ref mismatch, missing authority table, or known non-production project ref is a hard stop.

Do not use ad-hoc SQL or a second migration ledger to bypass Prisma history.

## Gate 3 — Authoritative catalog bootstrap

Production catalog bootstrap must be deterministic and reviewable:

- SALORA total products: `117`
- ACTIVE: `104`
- DRAFT: `13`
- Synthetic/POS_TEST/test-only rows: `0`

Import only approved SALORA catalog/media data. Do not clone operational orders, payments, sessions, logs, test users, or POS test data from non-production environments.

## Gate 4 — Menu Authority publication

1. Create the required SALORA collections and sections.
2. Validate product memberships, prices, images, bilingual content, and ordering configuration.
3. Create a revision.
4. Review and approve it through the governed lifecycle.
5. Publish the revision to WEB / DIGITAL_MENU / MOBILE channels.
6. Run `pnpm certify:production:data`.

Certification requires at least one SALORA collection, one PUBLISHED revision, one PUBLISHED publication, exact approved product counts, and zero synthetic products.

## Gate 5 — Vercel Production binding

Only after Production data certification:

- bind `DATABASE_URL` / `DIRECT_URL` to the dedicated Production project;
- set server-side `SALORA_ENVIRONMENT=production`;
- set `SALORA_EXPECTED_SUPABASE_PROJECT_REF` to the dedicated Production ref;
- preserve Preview/Test bindings separately;
- never copy `salora-pos-test` credentials into Production.

Redeploy from a certified `main` SHA and verify Git ↔ Vercel SHA identity.

## Gate 6 — AI activation

Public AI remains invisible until authoritative products are available and non-stale. After Menu Authority is published:

1. verify the AI provider is configured through server-only secrets;
2. verify rate limits and safety mode;
3. verify prompts are grounded in the published menu revision;
4. verify no service-role/database/provider secrets reach the browser;
5. run public concierge and Control Tower AI smoke tests.

AI must never invent prices, availability, customer data, operational state, or deployment state.

## Gate 7 — Go-live certification

Required outcomes:

- `/api/health` → `200`
- `/api/ready` → `200`
- `/api/products` → authoritative, non-stale Production catalog
- 117 total / 104 ACTIVE / 13 DRAFT
- no synthetic/test products
- at least one PUBLISHED Menu Authority revision/publication
- homepage and `/menu` show normal hospitality UI with no infrastructure language
- unauthenticated Control Tower remains protected
- no new Vercel runtime errors

## Rollback principle

Application rollback and data rollback are separate. A code rollback must never silently swap Production to Staging/Test. Database rollback requires its own reviewed plan, backup point, and explicit approval.
