# SALORA Executive Command Center Implementation Plan

Generated from the DEV UI migration blueprint set on 2026-05-31.

## Blueprint Files Consumed

- `docs/dev-ui-migration/DEV_EXECUTIVE_UI_AUDIT.md`
- `docs/dev-ui-migration/DEV_DASHBOARD_INVENTORY.md`
- `docs/dev-ui-migration/DEV_DESIGN_SYSTEM_AUDIT.md`
- `docs/dev-ui-migration/DEV_COMPONENT_EXTRACTION_PLAN.md`
- `docs/dev-ui-migration/DEV_TO_SALORA_DATA_MAPPING.md`
- `docs/dev-ui-migration/SALORA_COMMAND_CENTER_MAPPING.md`
- `docs/dev-ui-migration/SALORA_UI_MIGRATION_STRATEGY.md`
- `docs/dev-ui-migration/SALORA_UI_EXTRACTION_REPORT.md`
- `docs/dev-ui-migration/SALORA_FINAL_EXECUTIVE_REPORT.md`

## What Will Be Reused

- CommandDeck information architecture: executive KPI strip, revenue momentum, operational stream, audit/alert surface, and compact chart cards.
- App shell patterns from DEV `App.tsx`: left operating-room navigation, executive top ribbon, route-aware active state, role/status chips, and dense dashboard layout.
- Analytics panel patterns: runtime status, health scoring, trend panels, and alert severity display.
- Design system cues: obsidian surfaces, restrained gold accents, translucent glass cards, mono telemetry labels, compact executive controls, and high-contrast dark UI.
- AI studio patterns at widget level only: provider usage, evaluation score, cost, safety, latency, and fallback cards.

## What Will Be Redesigned

- Routing will be SALORA-owned Next.js App Router pages under `apps/web/app/(dashboard)/dashboard/**`, not DEV tab state.
- Data access will use typed SALORA dashboard adapters under `apps/web/lib/dashboard/**`, calling existing SALORA APIs where available.
- Charts will be lightweight CSS/SVG dashboard primitives for this wave because `recharts` is not currently installed in `@salora/web`.
- RBAC will remain enforced by existing intelligence API routes. The UI will show explicit unauthorized/error states rather than bypassing authorization.
- WhatsApp will be an explicit channel adapter with empty states where exact metrics are unavailable, instead of copying simulator-only DEV behavior.

## What Will Be Skipped

- Whole-file migration of `EnterpriseArchitect.tsx`.
- Whole-file migration of `HeadlessCms.tsx`.
- DEV `demoData.ts` as production dashboard state.
- Provider-specific `/api/gemini/*` contracts.
- Simulator-heavy WhatsApp, NFC, Wallet, Siri, CMS, and database studio modules.
- Unsplash and missing `/store_assets/*` dependencies.

## Dashboard Wave Plan

1. Wave 1: Executive dashboard shell, overview KPIs, runtime health, alerts, and cross-domain intelligence.
2. Wave 2: Revenue dashboard with gross/net revenue, AOV, refunds, failed payments, channel revenue, payment health, and trend placeholder driven by revenue analytics.
3. Wave 3: Operations dashboard with order volume, queue/notification health, inventory risks, runtime alerts, payment failures, and system health.
4. Wave 4: AI dashboard with provider usage, cost estimate, latency readiness, fallback readiness, evaluation score, safety blocks, and recommendation performance.
5. Wave 5: Customer dashboard with customer health, loyalty engagement, retention readiness, churn risk, recommendation acceptance, and value segments.
6. Wave 6: WhatsApp dashboard with conversations, message direction metrics, webhook health, latency, AI assistance, and explicit empty states where no exact API exists.
7. Later waves: mobile preview simulator, monitoring room, administration room, CMS controls, Enterprise Architect modules, and write-capable actions.

## Implementation Risks

- Intelligence API routes require bearer auth and manager/admin roles. Without an access token, dashboards must render unauthorized states.
- Existing revenue analytics does not expose a true time series, so trend views must communicate limited historical depth.
- WhatsApp metrics are not exposed as a first-class intelligence endpoint yet; adapter output must mark unavailable metrics as empty, not healthy.
- Some operational metrics are readiness flags rather than observed queue telemetry.
- The current web package does not include a charting library, so advanced Recharts parity is deferred until dependency approval.
- Browser-local token discovery is inherently UI-side; production SSO/session integration should replace it when SALORA auth UX is complete.

## Data Contract Mapping

| Dashboard | Primary SALORA APIs | Adapter | Empty-state policy |
|---|---|---|---|
| Executive | `/api/intelligence/kpis`, `/api/intelligence/revenue`, `/api/intelligence/operations`, `/api/intelligence/ai` | `executiveAdapter.ts` | Unauthorized/error state if API rejects; empty alerts if no alert records |
| Revenue | `/api/intelligence/revenue` | `revenueAdapter.ts` | Zero-value metrics only when API returns valid zero values |
| Operations | `/api/intelligence/operations`, `/api/health` | `operationsAdapter.ts` | Missing queues/channels shown as unavailable, not healthy |
| AI | `/api/intelligence/ai` | `aiAdapter.ts` | Provider/cost/evaluation metrics reflect API values; latency/fallback marked unavailable when absent |
| Customers | `/api/intelligence/customers`, `/api/intelligence/loyalty` | `customerAdapter.ts` | Value segments are derived presentation buckets from existing totals |
| WhatsApp | `/api/intelligence/operations`, `/api/health` | `whatsappAdapter.ts` | Exact WhatsApp metrics return explicit empty states until channel API exists |

## Completion Gate

Implementation can begin after this plan exists. The first release remains read-only, API-bound, RBAC-preserving, responsive, accessible, and production-build stable.
