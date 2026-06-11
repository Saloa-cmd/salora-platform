# Database Authority Certification

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Supabase/PostgreSQL should be the commercial source of truth, with Prisma as the single write layer for application-controlled data.

## Required Tables/Models

| Requirement | Local Prisma Evidence |
|---|---:|
| `product_images` | `model ProductImage` exists. |
| `product_media_drafts` | `model ProductMediaDraft` exists. |
| `promotions` | `model Promotion` exists. |
| `coupons` | `model Coupon` exists. |
| `activity_logs` | `model ActivityLog` exists. |
| `audit_logs` | `model AuditLog` exists. |
| `whatsapp_webhook_events` | `model WhatsappWebhookEvent` exists. |
| `cafe_orders` | `model CafeOrder` exists. |

## Commands

| Command | Result |
|---|---:|
| `prisma validate --schema prisma/schema.prisma` | PASS |
| `prisma generate --schema prisma/schema.prisma` | PASS |
| `prisma migrate status --schema prisma/schema.prisma` | FAIL/UNKNOWN |

## Evidence

- Prisma schema validation passed after loading `.env`.
- Prisma Client 7.8.0 generated to `packages/backend/src/database/generated`.
- `migrate status` connected far enough to identify the Supabase PostgreSQL host but failed with `Schema engine error`.

## Certification Status

`PARTIAL`

Local Prisma authority is valid. Live Supabase applied migration authority is not certified from this environment.

## Required Follow-Up

Run `prisma migrate status` from a network-capable, production-authorized environment and compare applied migrations with the 9 checked-in migration directories.
