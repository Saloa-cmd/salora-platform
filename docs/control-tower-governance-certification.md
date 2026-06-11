# Control Tower Governance Certification

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Control Tower remains the single operational authority for privileged commercial operations.

## Governance Requirements

Every write operation should include:

- CorrelationId/requestId
- ActorId
- RBAC validation
- AuditLog
- ActivityLog

## Evidence of Existing Governance

- Shared request/correlation helper: `requestId()` in `apps/web/lib/server/simpleLaunchControl.ts`.
- Shared RBAC helper: `requireControlPermission()`.
- Shared audit writer: `writeAudit()`.
- Shared activity writer: `writeActivity()`.
- Product writes use `writeAudit()` and `writeActivity()`.
- Category writes use `writeAudit()` and `writeActivity()`.
- Product image writes use `writeAudit()` and `writeActivity()`.
- Coupon writes use `writeAudit()` and `writeActivity()`.
- Promotion writes use `writeAudit()` and `writeActivity()`.
- Feature flag writes use `writeAudit()` and `writeActivity()`.
- Order writes/status changes use `writeAudit()` and `writeActivity()`.
- Media draft and media image writes use `writeAudit()` and `writeActivity()`.
- Admin bootstrap writes `AuditLog` and `ActivityLog`.

## Certification Matrix

| Domain | Status | Evidence |
|---|---:|---|
| Products | CERTIFIED | Shared Control Tower write helpers. |
| Categories | CERTIFIED | Category route writes audit/activity. |
| Inventory | PARTIAL | Action panel exists; full DB-backed inventory governance still needs route-level review. |
| Images | CERTIFIED | Product image and media routes write audit/activity. |
| Promotions | CERTIFIED | Promotion route writes audit/activity. |
| Coupons | CERTIFIED | Coupon route writes audit/activity. |
| Customers | PARTIAL | Customer APIs still include partial/in-memory service paths. |
| Orders | CERTIFIED | Control Tower orders route validates RBAC and writes audit/activity. |
| AI Studio | PARTIAL | AI Studio persists records; full governance depends on route-by-route audit of all AI write paths. |
| WhatsApp | PARTIAL | Webhook and send routes exist; duplicate ownership remains unresolved. |
| Instagram | PARTIAL | Endpoint exists; live provider integration not verified. |
| Runtime Config | CERTIFIED/PARTIAL | Runtime config writes have RBAC; duplicate config surfaces remain. |
| Feature Flags | CERTIFIED | Feature flag route writes audit/activity. |
| Audit Logs | CERTIFIED | Read route exists with RBAC. |
| Activity Logs | CERTIFIED | Read route exists with RBAC. |

## Remediation Applied

- Missing bearer token in Control Tower APIs now maps to 401 instead of generic 500.
- Page-level Control Tower authorization was added.

## Residual Risk

Not every non-Control-Tower write endpoint has been consolidated under Control Tower governance. Public commerce and webhook writes must remain externally reachable but need ownership documentation and audit parity.
