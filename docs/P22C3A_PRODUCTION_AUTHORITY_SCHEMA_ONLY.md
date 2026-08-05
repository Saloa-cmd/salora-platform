# SALORA P22C-3A — Production Authority Schema-Only Build

## Status

**Repository artifact only — not applied to any database.**

- Branch: `agent/p22c-3a-production-authority-schema-only`
- Base commit: `56ce7cfacf3a6c65e4792296498785d4c9985269`
- Production project reference: `grcycqdtjjfklibutfos`
- Production runtime remains: `legacy-catalog / compatibility`
- No migration was applied.
- No Production, Staging, or development database was contacted by this build workflow.
- No commit, push, pull request, deployment, or environment change was performed.

## P22C-3 evidence incorporated

The certified Production state before this repository build is:

- Product authority: `117 / 104 / 13 / 16`
  - 117 total products
  - 104 ACTIVE
  - 13 DRAFT
  - 16 categories
- Live Menu Authority: 104 visible products
- Runtime source: `legacy-catalog`
- Runtime mode: `compatibility`
- Schema gap: `FULL_AUTHORITY_SCHEMA_ABSENT`

Direct replay of Staging migrations remains prohibited because Production uses the legacy catalog shape and the historical authority migrations mix schema and data.

## Artifact produced

`prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql`

The migration creates only:

1. Six Menu Authority enum types.
2. Eight Menu Authority tables.
3. Foreign keys from authority membership and food-profile tables to the existing `catalog_products.id`.
4. Authority indexes and integrity checks.
5. Authority workflow functions and triggers.
6. RLS enablement and the 24 final policies.
7. Explicit function and table privileges required by the existing Supabase roles.

## Production-specific adaptations

### No permission seed

The historical P21 foundation inserted 12 role-permission rows. That seed is intentionally removed from P22C-3A.

After a future schema application, `menu_role_permissions` must remain empty until the separately approved P22C-3D data transaction.

### Final hardening folded into one migration

The repository P21A hardening is folded into this migration:

- direct `section_id` foreign-key index;
- fixed function search paths;
- `SECURITY INVOKER`;
- split role-permission administration policies;
- explicit function grants.

The superseded `menu_role_permissions_admin_write` policy is not created.

### RLS correlation repair

The historical food-profile public-read policies used an unqualified `product_id` inside a subquery. PostgreSQL resolved that reference against the inner membership row in Staging, producing a tautological comparison.

P22C-3A explicitly correlates:

- `membership.product_id = product_nutrition_profiles.product_id`
- `membership.product_id = product_allergen_profiles.product_id`

This RLS correlation repair prevents a verified profile from becoming visible merely because some unrelated published product exists.

### Legacy catalog preservation

The migration does not mention or change:

- `base_price`;
- `price_omr`;
- catalog product status, price, category, media, or availability data;
- product-category rows;
- the 117-product authority;
- the 16-category authority.

It references only the existing `catalog_products.id` and `catalog_products.status` contract required by authority foreign keys and public-read policies.

### Staging-only objects excluded

The following are explicitly excluded:

- `staging_certification_metadata`
- `staging_menu_authority_metadata`

## Fail-closed preflight

Before any future DDL execution, the migration requires:

- legacy `catalog_products` and `product_categories`;
- `catalog_products.id` as UUID;
- `catalog_products.status` using `ProductStatus`;
- `RoleName` and `ProductStatus` enum types;
- `salora_jwt_roles()`;
- `salora_is_staff()`;
- `salora_is_manager()`;
- `salora_is_admin()`;
- `auth.role()`;
- `gen_random_uuid()`.

It also requires all eight authority tables and all six authority enum types to be absent.

A mismatch raises an exception before any authority object is created, and the single transaction rolls back.

## Explicit prohibitions

P22C-3A contains no:

- `INSERT INTO`;
- standalone data `UPDATE`;
- `DELETE FROM`;
- `TRUNCATE`;
- `MERGE`;
- `COPY`;
- Seed;
- collection, revision, membership, publication, nutrition, allergen, or permission rows;
- `MENU_AUTHORITY_MODE` change;
- migration execution command;
- deployment command.

## Validation performed locally

The repository workflow runs:

```text
node scripts/p22c3a-production-schema-only.test.mjs
pnpm test:menu-collections-domain
pnpm test:menu-collections-hardening
pnpm --filter @salora/web exec prisma validate --schema ../../prisma/schema.prisma
git diff --check
```

These checks do not apply migrations and do not require a database connection.

## Next gates

### P22C-3B

Certify this exact migration SHA-256 on a disposable Supabase branch or isolated clone built from the Production legacy schema.

Required proof:

- all eight tables created;
- all six enum types created;
- 24 final RLS policies;
- expected indexes, foreign keys, triggers, grants, and function security settings;
- zero rows in every new authority table;
- product/category fingerprints unchanged;
- live compatibility unaffected;
- rollback rehearsal documented.

### P22C-3C

Only after P22C-3B certification and a separate explicit approval may the exact certified schema artifact be considered for Production DDL.

P22C-3C must keep runtime mode on `compatibility` and must not create authority data.

### P22C-3D and P22C-3E

Canonical collections, sections, memberships, revision, and publication belong to P22C-3D as a separate data transaction.

Shadow/dual-read certification and any consideration of `required` mode belong to P22C-3E under another approval.
