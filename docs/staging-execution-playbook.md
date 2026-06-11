# SALORA Staging Execution Playbook

Date: 2026-06-08

This playbook is for staging execution only. It does not authorize production deployment.

## Execution Order

1. Confirm Supabase backup/restore point.
2. Confirm staging environment, not production.
3. Confirm Node 22 runtime for pnpm/Prisma.
4. Run validation preflight:
   - `prisma validate`
   - `prisma generate`
   - `prisma migrate status`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
5. Add approved `JWT_SECRET` and `JWT_REFRESH_SECRET` to staging secret store.
6. Verify `getAuthEnv()` succeeds.
7. Create/verify `product-images` bucket.
8. Apply RLS migration in staging only after approval.
9. Run RLS catalog verification.
10. Run Control Tower auth tests.
11. Upload 12 real P0 assets.
12. Approve and publish media drafts.
13. Run website/mobile smoke tests.

## Rollback Order

1. Stop traffic to staging test surface if data access breaks.
2. Capture error evidence and request IDs.
3. If RLS caused outage, prefer Supabase backup restore.
4. Emergency rollback may disable RLS only with incident approval.
5. Revert application environment secret changes if auth activation is the cause.
6. Archive or unpublish incorrect media assets through Control Tower workflow.

## Validation Order

| Stage | Validation |
| --- | --- |
| Pre-RLS | Prisma validate/generate/status, lint, typecheck, test, build |
| Post-RLS | RLS enabled/policy counts, website product API, Control Tower reads |
| Auth | admin/manager/staff/unauthorized login and RBAC |
| Media | bucket, draft path, approve, publish, primary image |
| Commerce | public products, promotions, coupons, COD order test if approved |
| Integration | OpenAI staging prompt, WhatsApp staging webhook/send only if approved |

## Smoke Tests

| Test | Pass Criteria | Failure Criteria |
| --- | --- | --- |
| RLS catalog | Target tables have RLS enabled and policies > 0 | Any critical table has RLS false |
| Website public menu | Product API returns database source and active products | fallback/stale without visible status |
| Control Tower auth | Admin reaches `/control-tower`; unauthorized denied | unauthorized access or login failure |
| Control Tower API | Bearer-protected APIs return expected data | 401 for valid role or data leak for invalid role |
| Media publish | Approved draft creates ProductImage and primary image | auto-publish, fake URL, missing ProductImage |
| Mobile menu | API-backed product render and stale/error states work | static-only product flow |
| Build | Next build passes | compile/build/EPERM failure |

## Risk Assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| RLS blocks Prisma runtime | Critical | Stage first, verify exact DB role, restore backup if needed |
| JWT secrets misconfigured | Critical | Validate env parse before login |
| Missing product bucket | High | Create/verify bucket before media workflow |
| Fake/incorrect assets | High | Human approval required before publish |
| Node version drift | Medium | Use Node 22 in execution shell |

