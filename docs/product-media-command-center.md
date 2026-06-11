# Product Media Command Center

Date: 2026-06-03

## Status

Status: IMPLEMENTED_PENDING_MIGRATION_DEPLOYMENT

Product Media Command Center was added inside the existing Control Tower surface. No second dashboard was created.

## Capabilities

| Capability | Status | Notes |
| --- | --- | --- |
| Upload/register image draft | IMPLEMENTED | Creates `ProductMediaDraft`, not public image. |
| Replace published image | IMPLEMENTED | Updates existing `ProductImage` only. |
| Archive image | IMPLEMENTED | Uses archive/deleted timestamps, no hard delete. |
| Set primary image | IMPLEMENTED | Clears previous primary for the product. |
| Reorder gallery | IMPLEMENTED | Updates `sort_order`. |
| Generate AI image prompt | IMPLEMENTED | Stores prompt draft only. |
| Generate AI image draft | IMPLEMENTED | Stores draft metadata only. |
| Approve draft | IMPLEMENTED | Marks draft approved; does not publish. |
| Publish approved image | IMPLEMENTED | Creates `ProductImage` only from approved draft with real path or URL. |

## Workflow

```text
Product
-> Control Tower
-> Upload/register or AI prompt draft
-> ProductMediaDraft
-> Human approval
-> ProductImage
-> Website/Mobile public reads
```

## Safety

- No fake URLs.
- No auto-publishing.
- No hard deletes.
- All mutations require RBAC and write ActivityLog/AuditLog.
- Drafts are not consumed by website/mobile.

## API

Route: `/api/control-tower/media`

Primary actions: `create-draft`, `generate-image-prompt`, `approve-draft`, `reject-draft`, `archive-draft`, `publish-draft`, `replace-image`, `archive-image`, `set-primary`, `reorder-images`.
