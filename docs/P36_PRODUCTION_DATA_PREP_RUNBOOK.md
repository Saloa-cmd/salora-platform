# SALORA P36 — Production data preparation runbook

Date: 2026-08-29
Scope: approved media upload, ProductImage creation, seed-placeholder archival, and application of the 13 approved prices. This runbook does **not** authorize or perform product activation, Revision v2 creation, or publication.

## Authorization and hard gates

- Media approval: `APPROVE13MEDIA`.
- Data-preparation authorization: `AUTHORIZE-P36-PRODUCTION-DATA-PREP`.
- Execution requires an authenticated `ADMIN` with `catalog:write`.
- The endpoint is POST-only, Production-only, and bound to Supabase project `xikqnzvfnquiqyybkyvw`.
- The request must contain exactly:

```json
{
  "action": "prepare",
  "approvalToken": "AUTHORIZE-P36-PRODUCTION-DATA-PREP"
}
```

Endpoint: `/api/control-tower/p36-production-data-prep`.

## Server execution contract

1. Fetch the 13 allowlisted files from the certified Vercel Production asset origin.
2. Verify MIME, exact byte count, 1200 × 1200 dimensions, and SHA-256 before upload.
3. Upload to `salora-product-media` using immutable checksum-addressed paths and `x-upsert: false`.
4. Fetch every stored object and repeat the full integrity verification.
5. Acquire a PostgreSQL advisory transaction lock.
6. Re-resolve all 13 Production product IDs and require every item to remain `DRAFT`.
7. Reject unexpected prices or live-image conflicts.
8. In one database transaction, create published media drafts and ProductImage rows, archive—not delete—seed placeholders, apply only the approved prices, and write Audit/Activity records.
9. Re-query all 13 records. Any readiness mismatch rolls back the complete database transaction.
10. Return `activationPerformed: false` and `revisionPublished: false`.

The operation is idempotent. A retry reuses checksum-matching Storage objects and existing exact database records; it neither overwrites objects nor duplicates ProductImage rows. If Storage succeeds but the database transaction fails, the unattached immutable objects are safe to reuse on the next authorized retry.

## Post-execution verification

- 13 products remain `DRAFT`.
- 13 approved prices are non-zero and precise to three OMR decimals.
- Each product has exactly one live ProductImage with the approved checksum.
- Seed placeholders are archived and historical rows remain intact.
- Audit and Activity records contain the request ID and actor.
- Revision v1 remains unchanged and no MenuPublication is created.

Only after this evidence is recorded may the separate `ACTIVATE117` gate be considered.

## Rollback

- Restore the 13 previous prices (`0.000`) through an audited, separately authorized transaction.
- Archive the newly created ProductImage and owner-approved media-draft rows; do not delete them.
- Restore the archived seed drafts only if needed for historical operator review.
- Storage objects are immutable and may remain unattached; deletion is not the rollback mechanism.
- No Revision rollback is needed because this operation cannot create or publish Revision v2.

## Database and security impact

No Prisma schema, migration, index, RLS policy, or database role change is included. The browser never receives a Supabase secret or connects directly to PostgreSQL. P37 security/performance hardening remains out of scope.
