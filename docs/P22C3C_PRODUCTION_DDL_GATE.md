# SALORA P22C-3C — Controlled Production DDL Gate

## Status

**PREPARATION ONLY — no Production DDL execution is authorized by this change.**

- Production project reference: `grcycqdtjjfklibutfos`
- Production runtime must remain: `legacy-catalog / compatibility`
- Required runtime setting: `MENU_AUTHORITY_MODE=compatibility`
- Certified catalog baseline: `117 / 104 ACTIVE / 13 DRAFT / 16 categories`
- Approved migration SHA-256: `9dc141be031edc4956b59c0a89c8de10fadadfff0cac57168a150ff80e4b97c4`
- P22C-3B isolated PostgreSQL 17 certification: PASS
- Final Production approval: **NOT ISSUED**

No Production connection was made while preparing this gate. No migration, database write, environment change, deployment, or runtime-mode change was performed.

## Scope

P22C-3C is schema/RLS only. It may eventually apply the already-certified migration:

```text
prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql
```

The future execution may create only:

- 6 authority enum types;
- 8 authority tables;
- integrity constraints and indexes;
- 7 authority functions;
- 11 triggers;
- RLS on all 8 tables;
- 24 final policies;
- required grants for existing Supabase roles.

It must create **zero authority data rows** and must not create collections, sections, memberships, nutrition data, allergen data, revisions, publications, or role-permission seed data.

## Artifacts

### Snapshot

`scripts/p22c3c/sql/01_snapshot_read_only.sql`

Captures a repeatable-read JSON snapshot containing:

- PostgreSQL identity and version;
- product counts and deterministic fingerprint;
- category count, slugs, and deterministic fingerprint;
- authority table/enum presence;
- required helper-function presence;
- migration-ledger presence;
- staging-only metadata presence;
- long-running transaction count.

### Preflight

`scripts/p22c3c/sql/02_preflight_read_only.sql`

Runs inside a serializable read-only transaction and fails closed unless:

- PostgreSQL 17+ is used;
- the connection is primary, not a recovery replica;
- the execution role has required schema privileges;
- the legacy catalog prerequisites and RLS helpers exist;
- the complete authority schema is absent;
- staging-only metadata is absent;
- product authority is exactly 117 total / 104 ACTIVE / 13 DRAFT;
- categories are exactly 16;
- PAUSED and ARCHIVED product counts are zero;
- product/category slugs are unique;
- no product has an orphan category reference.

### Post-apply verification

`scripts/p22c3c/sql/03_post_apply_verify_read_only.sql`

Prepared now but executable only after separate final approval and a successful schema transaction. It verifies:

- 8 tables and 6 enums;
- 24 policies and RLS on all 8 tables;
- 7 functions and 11 triggers;
- no `SECURITY DEFINER` authority helpers;
- zero authority rows;
- staging metadata remains absent;
- PostgreSQL's normalized 63-byte membership index exists;
- product and category fingerprints are recaptured for comparison.

### Snapshot comparison

`scripts/p22c3c/compare-snapshots.mjs`

Compares the before/after JSON files and rejects any product/category count, slug, or fingerprint change.

### Rollback

`scripts/p22c3c/sql/04_rollback_authority_schema.sql`

The rollback is not authorized by this gate. It:

- requires a separate rollback approval session token;
- fails if the complete authority schema is not present;
- fails if any authority row exists;
- drops triggers, functions, constraints, tables, and enum types explicitly;
- never uses `CASCADE`;
- never mutates or drops `catalog_products` or `product_categories`.

The empty-data guard deliberately limits this rollback to P22C-3C, before P22C-3D creates canonical authority data.

## Mandatory future execution order

1. Confirm the exact Production project ref and database host out of band.
2. Verify `MENU_AUTHORITY_MODE=compatibility` without changing it.
3. Confirm live `/api/v1/menu-authority`, `/menu`, and `/api/products` return HTTP 200.
4. Capture the Snapshot JSON and immutable execution log.
5. Run the Preflight SQL with the same role intended for final DDL.
6. Verify the local migration canonical SHA-256 exactly matches the approved SHA.
7. Obtain a **separate final approval** for Production execution.
8. Apply only the approved migration in its existing single transaction.
9. Run Post-apply verification immediately.
10. Compare before/after snapshots.
11. Recheck `/api/v1/menu-authority`, `/menu`, and `/api/products` remain HTTP 200.
12. Keep `/api/ready` expectations unchanged until later authority data and publication phases.
13. Roll back only under separate approval and only while all authority tables remain empty.

## Abort conditions

Abort before DDL when any of these occurs:

- project/database identity cannot be proven;
- migration SHA differs;
- Production catalog is not 117 / 104 / 13 / 16;
- authority objects already exist;
- staging-only metadata exists;
- required helpers or privileges are missing;
- compatibility mode is not preserved;
- live compatibility endpoints are unhealthy;
- an immutable Snapshot cannot be captured;
- final execution approval has not been issued.

Abort after DDL and enter controlled rollback review when:

- any catalog fingerprint changes;
- any authority table contains data;
- RLS, policies, indexes, foreign keys, functions, or triggers fail verification;
- compatibility endpoints regress.

## Migration-ledger decision

P22C-3C preparation does not mutate `_prisma_migrations` or `supabase_migrations.schema_migrations`.

The final execution gate must explicitly choose and document one ledger strategy after the read-only Snapshot confirms which ledger exists. No manual ledger insertion is authorized by this preparation PR.

## Later phases

- **P22C-3D:** canonical collections, sections, memberships, revision, publication, and role-permission data in a separate transaction.
- **P22C-3E:** shadow/dual-read certification and later consideration of required mode.

Neither P22C-3D nor P22C-3E is authorized here.

## P22C-3C-A — SALORA brand-scope correction

All Production Snapshot, Preflight, and Post-apply catalog authority queries are explicitly restricted to:

```sql
brand_key = 'SALORA'
```

This is required because the Production database may contain catalog rows belonging to other brands. The certified authority baseline `117 / 104 ACTIVE / 13 DRAFT / 16 categories` applies only to SALORA.

The correction covers:

- product counts and deterministic fingerprints;
- category counts, slugs, and deterministic fingerprints;
- product-to-category orphan detection;
- duplicate product-slug checks;
- duplicate category-slug checks;
- before/after Snapshot comparison inputs.

A SALORA product linked to a missing or non-SALORA category fails the Preflight.

This correction changes no migration, authority schema, Production data, environment variable, deployment setting, or runtime mode. Production Snapshot and Preflight remain unexecuted until a new read-only execution approval is issued after this correction is merged.
