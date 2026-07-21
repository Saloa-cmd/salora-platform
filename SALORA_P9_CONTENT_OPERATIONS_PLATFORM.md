# SALORA P9 — Content Operations Platform

## Delivered

- Bilingual pages and reusable sections.
- Navigation and menu definitions.
- Banners, campaigns and landing pages.
- Immutable revisions with change summaries.
- Draft, review, approval, scheduling, publication and archive states.
- One-click rollback that creates a new auditable draft instead of rewriting history.
- RBAC gates for read, edit, approval and publication actions.
- Audit events for every state transition.
- A public read API that exposes only published or due-scheduled SALORA content.

## Isolation and security

Every CMS document carries `brand_key = SALORA`, enforced by both the application and a database check constraint. RLS is enabled and forced on all three CMS tables. Public roles receive SELECT only on published document metadata; revision payloads and approvals have no public grants. Administrative writes are performed server-side after the existing SALORA session and RBAC checks.

## Workflow

1. An editor creates or saves an immutable revision.
2. Saving cancels any approval for an older revision.
3. A manager submits the active revision for review.
4. An administrator approves or rejects that exact revision.
5. Only the approved active revision can be published or scheduled.
6. Rollback copies a historical payload into a new draft revision, preserving the full history.

## Deployment

Apply `202607210001_salora_content_platform` with `prisma migrate deploy`, then redeploy the web application. Run `pnpm test`, `pnpm --filter @salora/web lint`, and `pnpm --filter @salora/web build` before promotion.

The rollback SQL is destructive and intentionally requires an explicit export and operator approval.
