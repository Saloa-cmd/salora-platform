# SALORA Control Tower Enterprise Audit

Date: 2026-06-05
Workspace audited: `C:\dev\salora-platform`

## Entry Points

- Main page: `apps/web/app/(control-tower)/control-tower/page.tsx`.
- Section page: `apps/web/app/(control-tower)/control-tower/[section]/page.tsx`.
- Shell/navigation: `apps/web/components/control-tower/ControlTowerShell.tsx`.
- Registry: `apps/web/lib/control-tower/registry.ts`.
- Route path: `/control-tower`.
- Section route path: `/control-tower/[section]`.

## Valid Sections

`executive`, `revenue`, `orders`, `inventory`, `customers`, `loyalty`, `ai`, `whatsapp`, `instagram`, `notifications`, `content`, `automation`, `integrations`, `settings`.

## Runtime Components

- `ControlTowerView` renders the section shell.
- `SimpleLaunchOperationsCenter` is mounted for `executive`, `content`, `ai`, `settings`, and `revenue`.
- `SupremacyCommandCenter` is mounted for `executive`, `content`, `ai`, `whatsapp`, `instagram`, `settings`, `revenue`, and `orders`.
- Section action panels exist for product, inventory, loyalty, notification, runtime config, and WhatsApp presentation.

## Section Reality Matrix

| Section | Exists | Connected | Reads DB | Writes DB | Mock/Fallback | Runtime Finding |
|---|---:|---:|---:|---:|---:|---|
| Products | YES | YES | YES | YES | PARTIAL | `/control-tower/content` uses products/category/image APIs. Product list is DB-backed. |
| Product Media | YES | YES | YES | YES | PARTIAL | Media API reads product images/drafts and can create AI prompt drafts. Actual image generation is prompt/draft workflow, not verified binary generation. |
| Promotions | YES | YES | YES | YES | UNKNOWN | `/control-tower/revenue` reaches coupon/promotion APIs. External production campaign state not verified. |
| Coupons | YES | YES | YES | YES | UNKNOWN | Simple-launch coupon API exists and writes. |
| Orders | YES | YES | YES | YES | UNKNOWN | Control Tower orders API exists and supports PATCH status updates. |
| Customers | YES | PARTIAL | PARTIAL | PARTIAL | YES | Customer-facing domain has in-memory service paths; Control Tower customer section does not prove full DB workflow. |
| AI | YES | YES | YES | YES | YES | AI Studio routes write recommendation/media draft records; gateway can fall back to mock providers. |
| WhatsApp | YES | PARTIAL | YES | YES | PARTIAL | WhatsApp APIs and models exist, but duplicate webhook routes require canonicalization. |
| Instagram | YES | PARTIAL | YES | UNKNOWN | UNKNOWN | Control Tower Instagram endpoint exists; live provider integration not verified. |
| Runtime Config | YES | YES | YES | YES | UNKNOWN | Two config surfaces exist: `/api/control-tower/config` and `/api/control-tower/simple-launch/runtime-config`. |
| Feature Flags | YES | YES | YES | YES | UNKNOWN | Simple-launch feature flag API exists and writes audit/activity logs. |
| Automation | YES | UI ONLY/PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | Registry section exists; no full production automation runtime verified. |
| Integrations | YES | UI ONLY/PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | Registry section exists; external integrations not live-verified. |
| Settings | YES | YES | YES | YES | UNKNOWN | Runtime governance/config panels are present. |

## Authentication Requirements

- No page-level auth guard was found on the Control Tower page files.
- Client API calls use bearer tokens from localStorage keys: `salora_access_token`, `salora.accessToken`, `accessToken`.
- Control Tower read APIs require RBAC permissions such as `catalog:read`.
- Control Tower write APIs require permissions such as `catalog:write` or `system:write`.
- Missing bearer token throws `Missing bearer token.` in shared auth helper; Control Tower simple-launch error mapping does not explicitly map that to 401.

## Enterprise Findings

- Control Tower UI is real and build-verified.
- Several panels are connected to real DB APIs.
- Some sections are present as platform intent but are not fully proven as production-ready workflows.
- Control Tower currently depends on browser-local bearer token storage rather than an explicit route-level session guard.

## Recommendation

- Add route-level authorization for `/control-tower`.
- Normalize unauthenticated API responses to 401.
- Keep the UI, but classify partially wired sections honestly until live provider/database verification exists.
