# SALORA P22B — Control Tower Operator Workflow

## Scope

P22B extends the existing P21/P22 domain. It does not create a second menu
engine, duplicate catalog, duplicate API family, or new database tables.

## Operator capabilities

- live validation before revision and publication;
- live collection preview generated through the canonical revision builder;
- normalized diff between any two revisions, including legacy snapshots;
- accessible section and product ordering;
- optimistic concurrency through `MenuCollection.updatedAt`;
- bulk membership visibility, section movement, and featured status;
- immutable revision history;
- timezone-aware scheduling;
- permission-gated immediate publication and rollback;
- Control Tower audit history.

Bulk operations intentionally modify collection memberships only. They do not
change `CatalogProduct.status`, pricing, media, inventory, orders, or customer
data.

## Conflict protection

Every ordering, bulk, transition, revision, publication, and rollback request
carries the collection `updatedAt` value seen by the operator. A stale request
fails with `MENU_AUTHORITY_CONFLICT`; the operator must refresh before retrying.

## Publication protection

Publication and rollback require:

1. the correct RBAC permission;
2. matching collection/revision ownership;
3. a canonical `contractVersion: 2` revision;
4. a non-stale collection version;
5. 100% collection completeness;
6. a valid timezone and future schedule when scheduling.

## Staging separation

The repository implementation and local tests do not connect to Supabase.
Staging certification is a separate explicit command guarded by:

- `SALORA_ENVIRONMENT=staging`;
- `SALORA_MENU_AUTHORITY_MODE=required`;
- `ALLOW_STAGING_CERTIFICATION=true`;
- an expected Supabase project reference matching the connection string.

No production migration or deployment is authorized.
