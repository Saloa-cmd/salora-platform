# Control Tower Performance Certification

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Harden Control Tower list routes with query limits and pagination while preserving backward compatibility.

## Changes Applied

- Added shared `pagination()` helper in `apps/web/lib/server/simpleLaunchControl.ts`.
- Added bounded `take` and `skip` support to:
  - products
  - media images/drafts
  - coupons
  - promotions
  - orders
  - activity logs
  - audit logs

## Compatibility

Responses remain compatible with existing UI consumers. The routes still return the same top-level data shapes while accepting optional `limit` and `offset` query parameters.

## Query Limits

- Default limit: 100.
- Maximum limit: 100.
- Offset lower bound: 0.

## Index Review

Existing schema indexes support many current dashboard access patterns:

- `ActivityLog`: actor/time, entity/entityId, createdAt.
- `AuditLog`: entity/entityId/time, actor/time, action/time.
- `Session`: user, status, expiry.
- `RuntimeConfiguration`: scope/isActive and unique scope/key.

Further additive index review is recommended for high-volume orders/media once live query plans are available.

## Validation

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS after Argon2 enum build fix.

## Residual Risk

Pagination exists at API level, but the Control Tower UI still performs broad refreshes across several endpoints. Lazy loading by section should be the next performance pass.
