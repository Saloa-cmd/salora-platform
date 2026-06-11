# SALORA UI Extraction Report

## Files To Reuse

Reuse means adapt patterns and small component logic with SALORA-owned contracts.

| File / path | Reuse reason | Conditions |
|---|---|---|
| `src/components/CommandDeck.tsx` | Best source for executive overview, KPI, revenue chart, order stream, audit ledger | Split into cards/charts/feeds and bind to APIs |
| `src/components/AnalyticsPanel.tsx` | Health, diagnostics, chart and accessibility patterns | Normalize endpoint shape and extract widgets |
| `src/components/AiTuner.tsx` | Clean, focused controls for AI personality/tone/intensity | Persist config through `/api/ai/config` |
| `src/components/AIBrain.tsx` | Mature chat UX | Replace `/api/gemini/chat` with `/api/ai/chat` |
| `src/components/AIContentStudio.tsx` | Useful campaign studio pattern | Replace provider endpoint and add campaign approval workflow |
| `src/components/AIVisualHub.tsx` | Useful visual-spec generator | Enforce schema and persist outputs |
| `src/components/AutomationEngine.tsx` | Simple automation rule cards and workflow matrix | Replace local rules with operations automation API |
| `src/components/TeamRoster.tsx` | Role card pattern | Bind to real RBAC |
| `src/index.css` | Glass panel and gold executive utilities | Tokenize and prune ambient/decorative pieces |
| `design-system/**` | Structured tokens and primitives | Reconcile with actual app tokens |
| `mobile/components/**` | Mobile primitives | Align with SALORA mobile token system |
| `grafana/dashboards/queue-overview.json` | Monitoring dashboard seed | Align Prometheus datasource and metric names |

## Files To Refactor

| File / path | Refactor reason | Required decomposition |
|---|---|---|
| `src/App.tsx` | Monolithic shell, global state for all rooms | `DashboardShell`, `Sidebar`, `TopBar`, route config, providers |
| `src/components/EnterpriseArchitect.tsx` | Very large multi-purpose command center | Health, RBAC, pricing, inventory, reviews, WhatsApp, NFC, wallet, schema, security tests |
| `src/components/HeadlessCms.tsx` | Mixed CMS controls, app preview, product controls, mobile simulator | `AppConfigPanel`, `MobilePreviewSimulator`, `LayoutBlockEditor`, `LiveActivityPreview` |
| `src/components/DatabaseStudio.tsx` | Valuable admin UI but local-only tables | `AdminDataGrid`, table adapters, mutation dialogs, snapshot panel |
| `src/components/AppleIosHub.tsx` | Good simulator, not production integration | `WalletPassPreview`, `SiriShortcutSimulator`, icon showcase |
| `src/demoData.ts` | Useful fixture source, not production data | Split into test fixtures and demo stories |
| `server.ts` Gemini endpoints | Provider-specific APIs mixed in server | Route through SALORA AI gateway and schemas |
| `src/api/routes.ts` | Useful `/api/v1` foundation but incomplete mounts | Mount loyalty/notifications or map to target API families |

## Files To Rewrite

| File / path | Why rewrite |
|---|---|
| Production dashboard data loaders | Existing UI mostly uses local state and fixtures |
| `/api/gemini/*` frontend adapters | SALORA should use `/api/ai/*` provider-agnostic contracts |
| Dashboard routing | Current app uses local `activeTab` instead of routes |
| Authorization gating in UI | Current role controls are simulated |
| Media asset handling | Referenced `/store_assets/*` files are not present |
| WhatsApp dashboard backend | Existing flow is a simulator only |
| Wallet/PassKit backend | Existing flow is a mock preview |
| Revenue analytics backend | Existing charts are fixture-backed |

## Files To Ignore

| File / path | Reason |
|---|---|
| `dist/**` | Build output only; do not migrate compiled chunks |
| `node_modules/**` | Dependencies |
| `.pnpm-store/**`, `.pnpm-cache/**`, `.empty-node-modules/**` | Local package cache artifacts |
| `.build-outputs/**` | Generated artifacts |
| install logs and diagnostic logs | Not UI source |
| Hard-coded simulator-only copy | Keep only as reference for product language |

## Readiness Scores

| Area | Readiness | Notes |
|---|---:|---|
| Executive UI composition | 90% | Strong and immediately useful |
| Dashboard components | 80% | Need extraction and typed props |
| API integration | 45% | Endpoint mismatch and fixture reliance |
| Design system | 70% | Strong visual language, needs token unification |
| AI studio | 75% | Good UX, provider-specific backend |
| Mobile preview | 80% | Strong simulator, data layer missing |
| Admin/data studio | 65% | UX good, backend contracts missing |
| Monitoring | 75% | Backend exists, UI integration partial |

## Extraction Readiness Verdict

Ready for controlled extraction. Not ready for direct migration.
