# SALORA Simple Launch Audit

Date: 2026-06-02

## Executive Finding

SALORA is past the feature-building phase. The platform has enough infrastructure, commerce, AI, payment, and operating visibility to enter commercial activation, but the project contains a large number of expansion-era documents, optional providers, future CMS/automation plans, and prototype surfaces that should not be treated as launch blockers.

Launch rule: keep only systems that help a real cafe sell products, accept payments, operate orders, understand revenue, and use the AI Concierge safely.

## Major Subsystem Decisions

| Subsystem | Decision | Launch Rationale |
|---|---|---|
| Website | KEEP | Primary customer surface and product discovery channel. |
| Mobile App Foundation | KEEP | Useful launch foundation; do not expand beyond menu, cart, checkout, concierge, loyalty basics. |
| Control Tower | KEEP | Existing single operating surface for live actions, runtime config, provider readiness, and executive links. |
| Executive Command Center | KEEP | Keep for visibility; avoid adding more dashboard pages. |
| PostgreSQL / Supabase | KEEP | Certified database foundation for auth, commerce, runtime config, revenue, loyalty, and AI evaluation. |
| Redis / BullMQ | KEEP | Certified runtime queue/cache foundation; use only for launch-critical jobs. |
| OpenAI | KEEP | Primary commercial AI provider. |
| Gemini | POSTPONE | Future optional provider; not required for launch and previously returned completion connectivity issues. |
| Claude provider module | ARCHIVE | Future optional provider; not certified and not needed for launch. |
| Mock AI provider | KEEP | Required fallback and local safety net. |
| Stripe | KEEP | Certified test-mode payment foundation; required for revenue activation. |
| WhatsApp | POSTPONE | Architecture exists, but credentials are missing and channel is not required for first commercial launch. |
| Sentry | KEEP | Certified staging error tracking; keep lean. |
| OTEL collector/exporters | POSTPONE | Local observability exists, exporter certification is partial; not first-launch blocker if Sentry and app metrics are active. |
| Revenue Platform | KEEP | Required for payments, refunds, revenue metrics, and launch reporting. |
| Operations Intelligence | KEEP | Required to monitor order, payment, queue, and runtime health. |
| AI Concierge | KEEP | Differentiating customer and operator capability; OpenAI only for launch. |
| Loyalty Foundation | KEEP | Core retention capability; keep simple earn/reverse flows. |
| Runtime Configuration | KEEP | Database-driven settings reduce redeploys and code edits. |
| Universal Control Tower expansion | POSTPONE | Keep current Control Tower; do not build more centers. |
| Headless CMS plans | POSTPONE | Runtime config and product APIs are enough for launch; full CMS is not needed. |
| Automation Builder plans | POSTPONE | Use manual operations for launch; visual workflow builder can wait. |
| Integration Hub plans | POSTPONE | Keep OpenAI, Stripe, PostgreSQL, Redis, Sentry only. |
| Multi-tenant platform | POSTPONE | Launch one cafe/brand first. |
| WhatsApp Operations Center | POSTPONE | Channel can be activated after commercial launch. |
| Provider benchmarking reports | ARCHIVE | Useful history, not launch-critical. |
| DEV blueprint migration docs | ARCHIVE | Historical source material; not part of launch operating model. |
| Excess certification reports | ARCHIVE | Keep latest summaries; old phase reports should be retained as audit history but not used as active launch plan. |
| apps/admin placeholder | REMOVE | Empty/placeholder admin app should not be part of launch packaging unless needed later. |

## Keep

- `apps/web` customer site, APIs, Control Tower, dashboards, payments, Sentry.
- `apps/mobile` launch foundation only.
- `packages/backend` domains for products, orders, customers, loyalty, payments, AI, runtime config, Redis, metrics, health.
- Prisma schema and migrations.
- Launch-critical docs: production checklist, database/redis/openai/stripe/sentry certifications, simple launch docs.

## Archive

- DEV migration blueprint history.
- Provider benchmarking history.
- Older phase-by-phase certification duplicates once the latest launch docs are accepted.
- Future architecture documents for CMS, automation, integration hub, multi-tenant, WhatsApp expansion.

## Remove

- Empty or placeholder applications not used in launch packaging, starting with `apps/admin` if it contains no implementation beyond README.
- Stale temporary logs and pid files after confirming no local server depends on them.

## Postpone

- Full CMS.
- Automation builder.
- WhatsApp activation.
- Gemini/Claude activation.
- Multi-project management.
- OTEL exporter certification.
- Full disaster-recovery live drill beyond the required pre-launch Supabase backup/restore procedure.

## Launch Risk

The largest launch risk is not missing features. It is over-scoping. SALORA should launch with a smaller, operationally proven stack and add channels or providers only after revenue traffic is stable.
