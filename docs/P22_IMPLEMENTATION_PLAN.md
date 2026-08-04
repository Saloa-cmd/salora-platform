# SALORA P22 — Enterprise Implementation Plan

## Objective

Establish one published `MenuCollectionRevision` as the governed menu authority
for Website, Mobile, QR, Search, AI, Analytics and Control Tower without
creating a second catalog or touching production data.

## Audit findings

1. Public web rendering queried `CatalogProduct` directly and used
   `@salora/data` as a hidden fallback.
2. AI routes injected the same static package instead of a published revision.
3. Mobile consumed `/api/products`, used static category chips and had no
   revision-aware cache despite AsyncStorage being installed.
4. Control Tower managed products and media but did not expose the existing
   P21 collection/revision/publication domain.
5. P21 revision snapshots omitted variants, add-ons, modifiers, pricing rules,
   availability rules and category metadata.
6. The seed was not deterministic because its update path did not update status
   or base price.

## Controlled delivery

### Gate 1 — Authority Core

- canonical immutable revision contract v2;
- published-revision reader with explicit compatibility mode;
- versioned menu authority API;
- website and QR integration;
- mobile revision cache and offline recovery;
- AI source migration;
- Control Tower authority workspace;
- revision-scoped analytics endpoint;
- deterministic 117 / 104 / 13 seed validation.

### Gate 2 — Operator Workflow

- section reorder and product membership operations;
- revision diff viewer;
- preview, scheduling, publishing and rollback UI;
- live validation and bulk operations;
- complete audit-history presentation.

### Gate 3 — Staging Certification

- apply repository migrations to `salora-p21-staging` only;
- seed deterministic authority;
- create canonical revision v2 through the domain service;
- set `SALORA_MENU_AUTHORITY_MODE=required`;
- RLS, API, web, mobile, QR, AI, analytics and rollback certification.

### Gate 4 — Production Activation Review

No production migration or deployment is authorized by P22 implementation.
Production activation requires a separate approved change window, backup,
migration review and rollback rehearsal.
