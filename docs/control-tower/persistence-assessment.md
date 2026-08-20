# P25 PR3 Persistence Assessment

Baseline: `058cfa5592a94a4c791cb467dc742fe9bb6c95bb`. This assessment was completed before changing persistence. It does not authorize or apply a Production migration.

| Capability | Existing persistence | Decision | Rationale |
|---|---|---|---|
| ExperiencePageV2 drafts | `RuntimeConfiguration` JSON, scoped by `HOMEPAGE` | EXTEND | The payload is strict, typed, versioned and bounded to an approved component registry. A new table adds migration risk without improving PR3 draft safety. |
| ExperienceConfiguration v1 | Existing draft/published runtime keys | DEPRECATE for authoring; KEEP for compatibility | It remains the production compatibility contract. PR3 does not expand its direct `system:write` publish path. |
| CMS documents/revisions/approvals | `CmsDocument`, `CmsRevision`, `CmsApproval` | KEEP / HARDEN in PR4 | Relational lifecycle data is appropriate for review, approval, scheduling, publish and rollback, which are outside PR3. |
| Menu authority | `MenuCollection`, immutable revision/publication models | KEEP | It is the governed catalog lifecycle. PR3 exposes status but does not activate or publish it. |
| Products/categories | Relational catalog models | KEEP | Prices, status, categories and visibility require constraints and relational integrity. |
| Product media | `ProductImage`, `ProductMediaDraft` | KEEP / HARDEN | Existing draft/approval metadata is preferable to a second asset model. Generic non-product assets remain a known limitation. |
| Orders/customers/loyalty/promotions | Existing relational models | KEEP | Existing domain services, state transitions and audit behavior are reused. |
| RBAC/RLS/audit | roles, permission map, auth context, `ActivityLog`, `AuditLog` | HARDEN | Server checks and RLS context already exist; navigation is now filtered server-side but never treated as authorization. |
| Runtime/feature configuration | Typed runtime models | KEEP | Appropriate only for non-secret bounded configuration—not business logic or arbitrary JSON execution. |

## Decision

No schema addition is required for PR3. The new key `salora_experience_page_v2_homepage_draft` stores only validated `ExperiencePageV2` with `status=DRAFT`. The mutation path is authentication → Zod → `content:write` authorization → repository with auth context → database → activity/audit. Save never equals publish.

## Rollback and platform impact

- Code rollback removes the PR3 editor and route behavior; the isolated draft key is ignored by the current production renderer.
- Web/mobile/digital-menu compatibility remains controlled by `platformOverrides` and the shared renderer contract.
- Production migration required: **NO**.
- Production migration executed: **NO**.
