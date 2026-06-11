# SALORA Staging Smoke Test Matrix v3.0

Date: 2026-06-08

This matrix is a staging execution plan only. It does not authorize production changes, RLS activation, data mutation, image upload, WhatsApp sends, or OpenAI paid calls without explicit approval.

| Area | Purpose | Steps | Expected Result | Pass Criteria | Fail Criteria | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Prisma validate | Confirm schema parse | Run `prisma validate` | Schema valid | Exit 0 | Any schema error | High |
| Prisma generate | Confirm generated client can refresh | Stop dev/build watchers, run `prisma generate` | Client generated | Exit 0 | EPERM or generator error | Critical |
| Prisma migrate status | Confirm migration chain visibility | Run `prisma migrate status` against staging | Applied/pending migrations listed | Exit 0 and migration state known | Schema engine error or unknown state | Critical |
| RLS preflight | Confirm policy deployment safety | Run non-mutating SQL review/preflight for existing policies | No conflicts | No duplicate policy names | Policy conflicts or unsafe SQL | Critical |
| RLS staging apply | Validate RLS in staging only | After backup and approval, apply migration in staging | RLS enabled, policies active | Target tables protected, app flows pass | App breaks or data exposure | Critical |
| Admin login | Verify admin auth | Login with approved admin account | Cookies and token issued | Admin reaches Control Tower | Login failure/session missing | Critical |
| Manager login | Verify manager RBAC | Login manager, access catalog/orders | Manager can read/write allowed domains | Expected permissions only | Over/under-permission | High |
| Staff login | Verify staff RBAC | Login staff, access orders/read catalog | Staff restricted from manager/admin writes | Write denial works | Privilege escalation | High |
| Unauthorized access | Verify guard denial | Access `/control-tower` without token | Redirect/401/403 | No protected data | Any protected render | Critical |
| Control Tower products | Verify catalog ops | Read products section | Products load from DB | Runtime source visible, no fallback masking | Empty hidden failure | High |
| Control Tower orders | Verify COD queue | Read orders section | Orders load or empty state visible | No silent backend failure | Hidden failure/fake records | High |
| Control Tower media | Verify drafts/images | Read media section | 12 drafts, 0 images until upload | Honest empty image state | Fake images or hidden failure | Critical |
| Control Tower promotions | Verify revenue config | Read promotions | Existing records load | DB-backed list | Fallback/mock data | Medium |
| Control Tower coupons | Verify coupon data | Read coupons | Existing records load | DB-backed list | Fallback/mock data | Medium |
| Runtime config | Verify governance | Read runtime config | Config loads via guarded API | Permission checked | Unauthorized config read/write | High |
| Website products | Verify public menu | Open homepage/API | 96 active products render | DB source, stale=false | Fallback or stale without warning | High |
| Website images | Verify public media | Open public menu after image upload | Primary images render | Real ProductImage URLs only | Missing/fake images | Critical |
| Website SEO | Verify metadata | Inspect homepage, robots, sitemap | Metadata available | Title/OG/sitemap valid | Missing commercial metadata | Medium |
| Mobile home/menu | Verify API product sync | Run app against staging API | Products load with runtime source | Loading/error/stale states work | Static-only render | High |
| Mobile product detail | Verify detail sync | Open P0 product detail | Detail uses API-backed data | Data matches website/API | Static `@salora/data` fallback | High |
| Mobile checkout | Verify order flow | Place approved staging COD order | Order created in API | Order appears in Control Tower | Mock WhatsApp/order only | Critical |
| OpenAI provider | Verify real provider | Run controlled staging prompt | Provider source, latency, cost visible | No unbounded spend, fallback visible | Mock masking real failure | Medium |
| OpenAI draft safety | Verify media draft behavior | Generate image prompt in staging | Draft only, no ProductImage | Human approval required | Auto-publish | Critical |
| WhatsApp webhook | Verify inbound security | Send signed staging webhook | Event persisted | Signature verified, event visible | Unsigned accepted or not persisted | High |
| WhatsApp send | Verify approved send | Send to approved staging recipient only | Message receipt logged | No customer send without opt-in | Send blocked/unauthorized send | High |
| Observability | Verify runtime visibility | Trigger controlled staging error | Sentry/trace/log visible | Redacted event received | No event or secrets exposed | High |
| Audit logs | Verify accountability | Perform approved guarded mutation | Activity/audit row written | Actor/request IDs present | Missing audit trail | High |
| Backup/rollback | Verify recovery plan | Confirm Supabase backup and rollback plan | Restore point documented | Human-approved rollback path | No backup proof | Critical |

