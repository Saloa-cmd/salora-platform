# SALORA Critical Action Board

Date: 2026-06-08

Mission: blocker elimination root cause board. This is not a readiness certification.

## Final Decision

FIXES_IDENTIFIED

All current P0 blockers have identifiable root causes and concrete remediation paths. They are not yet removed.

## Blocker Board

| Blocker | Root Cause | Impact | Fix Effort | Risk | Dependencies | Owner | Priority | Expected Resolution Time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RLS disabled | `20260608_security_hardening` exists locally but is not applied; live tables have RLS false and zero policies | Database not security-hardened | Medium | Critical | RLS SQL remediation, Supabase backup, staging approval | Principal Database/Security Engineer | P0 | 0.5-1 day for SQL fix/review, plus staging window |
| RLS policy design | JWT role helper and app-auth/Supabase-claim model are incomplete | Policies may over-restrict app or fail direct clients | Medium | Critical | Auth model decision | Security/Auth Architect | P0 | 0.5 day |
| Prisma EPERM | Sandbox filesystem write denial for `C:\dev\salora-platform`, not file lock; outside sandbox generate/build pass | False blocker during validation | Low | Medium | Run commands outside sandbox or move workspace to writable root | Platform Engineer | P0 | 1-2 hours |
| Prisma migrate status | Inside sandbox schema-engine failed; outside sandbox works and reports pending RLS migration | Migration state previously unclear | Low | High | Same unrestricted execution environment | Prisma Engineer | P0 | 1 hour |
| Node mismatch | `pnpm.cmd` reports Node v24 while project requires Node 22 | Runtime drift risk | Low | Medium | Node 22 pnpm activation | Platform Engineer | P0 | 1 hour |
| Control Tower auth | `JWT_SECRET` and `JWT_REFRESH_SECRET` absent | Production-mode login cannot initialize | Low | Critical | Approved secret management | Authentication Engineer | P0 | 30-60 minutes after approval |
| Auth live validation | Login/refresh writes sessions; no-write rule blocks full test | Cannot prove session persistence | Low | High | Approved staging write test | QA/Auth Engineer | P0 | 1-2 hours |
| Product media images | 12 drafts exist but all lack storage path/public URL; `ProductImage` count is 0 | Public/mobile menu lacks real visuals | Medium | Critical | Real assets, storage bucket, Control Tower auth | Product/Media Owner + Platform | P0 | 0.5-1 day after assets ready |
| Supabase storage | `storage.buckets` returned empty list; `product-images` bucket not visible | Upload workflow cannot be activated | Low/Medium | High | Supabase storage admin access | Supabase Engineer | P0 | 1-2 hours |

## Immediate Execution Order

1. Run validation outside sandbox or move workspace into a writable root.
2. Activate Node 22 for pnpm commands.
3. Fix RLS helper and policy deployment safety.
4. Approve and set `JWT_SECRET` and `JWT_REFRESH_SECRET`.
5. Create/verify `product-images` bucket.
6. Upload 12 real P0 assets and attach them to existing drafts.
7. Run staging-only auth/media/RLS smoke tests after explicit approval.

## Non-Negotiable Guardrails

- Do not apply RLS before SQL remediation and backup.
- Do not use fake image URLs.
- Do not bootstrap/admin-login against production without approval.
- Do not claim soft-launch readiness until blockers are actually removed.

