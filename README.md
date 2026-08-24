# SALORA Platform

SALORA is a production-oriented hospitality platform for **Salora.Cafe**: premium customer web and mobile experiences, digital menu and ordering, a governed Control Tower, Menu Authority, operational intelligence, loyalty/commerce foundations, and AI assistance grounded in authoritative SALORA data.

> The repository is no longer a Phase 1 mock. Historical phase reports are retained under `docs/archive/`; current provider state, code, Prisma history, and active runbooks are authoritative.

## Architecture

```text
salora-platform/
├── apps/
│   ├── web/        # Next.js customer experience + Control Tower + APIs
│   └── mobile/     # Expo / React Native customer experience
├── packages/
│   ├── backend/    # database, domains, AI gateway, analytics, jobs, integrations
│   ├── config/     # runtime configuration
│   ├── data/       # shared catalog/reference data
│   ├── types/      # shared contracts
│   └── ui/         # shared design primitives/tokens
├── prisma/
│   ├── migrations/ # executable linear Prisma migration history
│   └── baselines/  # historical certification artifacts; never auto-deployed
├── scripts/        # audits, certification, safety gates, maintenance
└── docs/           # active runbooks + governance + historical archive
```

## Core runtime

- **Web:** Next.js App Router, React, TypeScript
- **Mobile:** Expo / React Native
- **Control Tower:** protected administrative experience inside `apps/web`
- **Data:** PostgreSQL / Supabase through server-side repositories and Prisma
- **Security:** authenticated APIs/server actions, RBAC, RLS context, typed validation, audited mutations
- **AI:** governed AI gateway with menu-grounded public concierge and permission-scoped Control Tower Copilot
- **Queues / cache:** Redis + job infrastructure where enabled
- **Deployment:** Vercel for web/preview environments

The browser must never receive PostgreSQL credentials, Supabase service-role credentials, database URLs, Redis secrets, provider tokens, or arbitrary SQL capability.

## Environment model

SALORA environments are isolated by provider identity, not by labels alone.

- **Production:** dedicated Supabase project only; must pass P31 identity/data certification.
- **Staging:** non-production validation and authority lifecycle testing.
- **POS Test:** synthetic isolated test data only; never a Production source.
- **Vercel Preview:** must remain isolated from Production writes and synthetic public-data leakage.

Known Staging/Test refs are rejected by the P31 Production preflight. See `docs/P31_PRODUCTION_DATA_RUNBOOK.md`.

## Local development

Requirements:

- Node `>=22 <23`
- pnpm `11.7.0`

```bash
pnpm install
pnpm dev:web
pnpm dev:mobile
```

Copy `.env.example` to a local environment file and provide only the values required for the feature being tested. Never commit secrets.

## Verification

Primary gates:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:smoke
```

Production Data read-only gates:

```bash
pnpm audit:production:preflight
pnpm certify:production:data
```

Staging Prisma drift audit:

```bash
pnpm audit:staging:migrations
```

Production commands require explicit server-side environment identity and the expected Supabase project ref. They fail closed on known Staging/Test refs.

## Menu Authority

Customer-facing menu data must come from a governed, published authority revision. The lifecycle is intentionally reviewable and auditable. Synthetic/test products are quarantined from public menu surfaces.

Approved catalog baseline used by current Production certification:

- `117` SALORA products total
- `104` ACTIVE
- `13` DRAFT
- `0` synthetic/POS_TEST products in Production

The customer UI does not expose database health, compatibility mode, source/revision jargon, or deployment state. Operational detail belongs in Control Tower and observability surfaces.

## Production Data

The current Production Data procedure is:

**`docs/P31_PRODUCTION_DATA_RUNBOOK.md`**

High-level sequence:

1. provision a dedicated Production Supabase project;
2. verify provider identity and deploy the linear Prisma schema;
3. bootstrap only approved SALORA catalog/media data;
4. create/review/publish Menu Authority;
5. pass Production Data certification;
6. bind Vercel Production to that dedicated project;
7. activate grounded AI and run final runtime/go-live checks.

Never promote Staging or POS Test into Production as a shortcut.

## Repository governance

- Work on scoped branches and PRs.
- Preview and CI must pass before merge.
- Production database migrations, provider-cost creation, secret/environment changes, and destructive operations are separate controlled gates.
- Historical reports belong under `docs/archive/` and must not be interpreted as current environment routing instructions.

## Brand

**SALORA.CAFE**  
**Taste the Harmony**
