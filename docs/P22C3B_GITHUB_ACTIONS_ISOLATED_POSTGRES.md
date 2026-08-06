# SALORA P22C-3B — GitHub Actions Isolated PostgreSQL 17 Certification

## Purpose

P22C-3B certifies the merged P22C-3A schema-only migration without using a paid Supabase Branch and without requiring Docker on the developer workstation.

The certification runs in a temporary PostgreSQL 17 service container attached to a GitHub-hosted Ubuntu runner.

## Approved migration

```text
prisma/migrations/202608050001_p22c3a_production_authority_schema_only/migration.sql
```

Canonical UTF-8/LF SHA-256:

```text
9dc141be031edc4956b59c0a89c8de10fadadfff0cac57168a150ff80e4b97c4
```

## Workflow

Certification workflow:

```text
.github/workflows/p22c3b-isolated-postgres.yml
```

Workflow name:

```text
P22C-3B Isolated PostgreSQL Certification
```

The workflow is triggered by pushes to the dedicated certification branch:

```text
agent/p22c-3b-github-actions-postgres17
```

It also keeps `workflow_dispatch` for controlled manual certification after the workflow exists on the default branch.

The general `.github/workflows/ci.yml` remains unchanged from `main`.

## Synthetic Legacy baseline

The temporary database reproduces the structural prerequisites required by the Production-specific migration:

- `RoleName`
- `ProductStatus`
- `product_categories`
- `catalog_products.base_price`
- `auth.role()`
- `salora_jwt_roles()`
- `salora_is_staff()`
- `salora_is_manager()`
- `salora_is_admin()`
- Supabase-compatible roles: `anon`, `authenticated`, `service_role`

Synthetic catalog authority:

```text
Products:   117
ACTIVE:     104
DRAFT:       13
Categories:  16
```

The fixtures contain no customer, payment, order, credential, or Production data.

## Certification gates

The workflow verifies:

1. PostgreSQL major version 17.
2. Canonical migration SHA-256.
3. Creation of exactly 8 Menu Authority tables.
4. Creation of exactly 6 authority enum types.
5. Creation of the 24 final RLS policies.
6. RLS enabled on all 8 authority tables.
7. Expected indexes, constraints, triggers, and functions.
8. No `SECURITY DEFINER` authority helpers.
9. Zero rows in every authority table.
10. No Staging-only metadata tables.
11. Product and category fingerprints unchanged after migration.
12. Explicit rollback rehearsal.
13. Product and category fingerprints unchanged after rollback.
14. Existing Legacy RLS helper functions preserved.

## Isolation and cost boundary

This phase does not create a Supabase Branch.

It does not use:

- Supabase project credentials;
- Production or Staging database URLs;
- Vercel environment variables;
- repository database secrets;
- Production data;
- a developer workstation Docker installation.

The PostgreSQL service container is destroyed when the GitHub Actions job finishes.

GitHub Actions usage is limited to the account's existing workflow-minute allowance.

## Report

The job uploads:

```text
p22c3b-postgres17-certification
```

The artifact contains `p22c3b-certification.json` and is retained for 14 days.

## Production boundary

P22C-3B is evidence only.

It does not authorize or perform P22C-3C. No Production DDL may be applied without a new explicit approval after reviewing the P22C-3B report.
