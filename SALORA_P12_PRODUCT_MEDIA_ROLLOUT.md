# SALORA product media rollout

This change imports the complete 117-image catalog as reviewable media drafts. It never publishes unreviewed assets.

## Safety gates

- Exactly 117 WebP files and 117 `brand_key = SALORA` products are required.
- Every filename must map one-to-one to a product slug; 12 legacy asset names use explicit aliases.
- Upload paths are content-addressed by SHA-256, making retries idempotent.
- Browser clients receive no Storage write policy or secret key.
- Draft approval and publication remain under Control Tower RBAC and audit logs.

## Operator flow

1. Apply the Storage migration.
2. Run the importer without `--apply` and confirm the 117/117 gate.
3. Run with `--apply` to upload and create/update drafts.
4. Review images in Control Tower and approve acceptable drafts.
5. Run with `--apply --publish-approved` or publish individually from Control Tower.
6. Verify Arabic/English menu cards, mobile breakpoints, and `/api/health`.

## Commands

Recommended secure Windows runner:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-salora-product-media.ps1
```

Manual equivalent:

```powershell
pnpm --filter @salora/web exec prisma migrate deploy --config ../../prisma.config.ts
node --experimental-strip-types scripts/import-salora-product-media.mjs
node --experimental-strip-types scripts/import-salora-product-media.mjs --apply
```

After approving selected drafts in Control Tower:

```powershell
node --experimental-strip-types scripts/import-salora-product-media.mjs --apply --publish-approved
```

Required server-only variables: `DIRECT_URL`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`). Never expose these as `NEXT_PUBLIC_*`.
