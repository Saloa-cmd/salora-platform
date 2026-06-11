# DEV Component Extraction Plan

## Extraction Rules

Do not copy files blindly. Extract behavior, composition, and visual patterns into SALORA-owned components. Every migrated component should receive typed props, API-backed data, loading/error/empty states, and design-system tokens.

## Immediate Migration

| Target component | Source files | Why migrate | Required refactor |
|---|---|---|---|
| `DashboardShell` | `src/App.tsx` | Mature sidebar, telemetry ribbon, role selector, responsive shell | Replace tab state with SALORA routing; move nav config to data; remove ambient orbs or make optional |
| `TopBar` | `src/App.tsx` | Strong executive telemetry ribbon | Tokenize, pass clock/status/role props |
| `Sidebar` | `src/App.tsx` | Complete operating-room navigation | Split into groups and route links; add active route integration |
| `KpiCard` | `CommandDeck.tsx`, `AnalyticsPanel.tsx` | Repeated KPI pattern | Typed metric value/change/icon/status props |
| `RevenueCard` | `CommandDeck.tsx` | Executive revenue tile | Bind to `/api/payments` or revenue aggregation API |
| `AnalyticsCard` | `CommandDeck.tsx`, `AnalyticsPanel.tsx` | Reusable chart panel pattern | Chart wrapper props and loading states |
| `ChartWidgets` | `CommandDeck.tsx`, `AnalyticsPanel.tsx` | Mature Recharts usage | Extract `AreaTrend`, `DonutShare`, `ChartPanel` |
| `AlertWidgets` | `AnalyticsPanel.tsx`, `EnterpriseArchitect.tsx` | Log/test/status indicators | Standardize severity and timestamp model |
| `AuditLogFeed` | `CommandDeck.tsx`, `DatabaseStudio.tsx`, `EnterpriseArchitect.tsx` | Important executive/admin pattern | Bind to `/api/operations/audit` or `/api/v1/system/events` |
| `OperationsQueueWidget` | `CommandDeck.tsx`, `HeadlessCms.tsx` | Live order stream pattern | Bind to orders/operations APIs and realtime events |
| `AIWidgets` | `AIBrain.tsx`, `AIContentStudio.tsx`, `AIVisualHub.tsx`, `AiTuner.tsx` | Mature AI studio UX | Replace Gemini-specific endpoints with SALORA `/api/ai/*` contracts |
| `MobilePreviewSimulator` | `HeadlessCms.tsx` | High-value executive preview of customer app | Split from CMS state; use controlled preview data |

## Optional Migration

| Target component | Source files | Reason optional | Required refactor |
|---|---|---|---|
| `CommandCenter` | `EnterpriseArchitect.tsx` | Rich, but very large and simulator-heavy | Decompose into `SystemHealthPanel`, `PricingSimulator`, `WhatsAppSimulator`, `SecurityTestPanel` |
| `AdminDataGrid` | `DatabaseStudio.tsx` | Good UX but local-only data | Rewrite data adapter, permissions, mutation flows |
| `WorkflowMapWidget` | `AutomationEngine.tsx` | Useful for automation visualization | Replace static nodes with actual automation definitions |
| `WalletPassPreview` | `AppleIosHub.tsx`, `EnterpriseArchitect.tsx` | Useful for loyalty dashboards | Bind to loyalty APIs |
| `SiriShortcutPanel` | `AppleIosHub.tsx` | Nice demo, lower immediate business value | Keep as simulator only unless native integration is planned |
| `MediaAssetViewer` | `MediaLibrary.tsx` | Useful but asset paths are not present | Bind to CMS/media service |
| `RoleProfileCard` | `TeamRoster.tsx` | Good admin support pattern | Bind to SALORA RBAC model |
| `AccessibilityControlPanel` | `AnalyticsPanel.tsx` | Good governance feature | Move to global user preferences |

## Deprecated / Do Not Migrate As-Is

| Source | Issue | Replacement |
|---|---|---|
| `src/App.tsx` as a whole | Monolithic state owner with all dashboard state in one component | Route-based shell plus feature modules |
| `EnterpriseArchitect.tsx` as a whole | 1,300+ lines, many unrelated modules and local simulators | Decompose; migrate only validated modules |
| `HeadlessCms.tsx` as a whole | Very large, mixed CMS controls, simulator, product editor, live activity | Split into CMS, mobile preview, and simulator modules |
| `demoData.ts` as production source | Fixture-only and includes display copy, roles, analytics, products | Replace with typed fixtures for tests and API-backed loaders |
| Emoji/garbled-label UI | Encoding and professionalism risks | Replace with lucide icons and localized strings |
| Direct `/api/gemini/*` dependency | Provider-specific and not aligned to SALORA API namespace | Use SALORA `/api/ai/*` gateway |

## Component Ranking

Immediate migration:

- `DashboardShell`
- `Sidebar`
- `TopBar`
- `KpiCard`
- `RevenueCard`
- `AnalyticsCard`
- `ChartWidgets`
- `MetricWidgets`
- `AlertWidgets`
- `AIWidgets`
- `OperationsQueueWidget`
- `AuditLogFeed`
- `MobilePreviewSimulator`

Optional migration:

- `CommandCenter`
- `AdminDataGrid`
- `WorkflowMapWidget`
- `WalletPassPreview`
- `SiriShortcutPanel`
- `MediaAssetViewer`
- `RoleProfileCard`

Deprecated:

- Monolithic `App.tsx`
- Whole-file `EnterpriseArchitect.tsx`
- Whole-file `HeadlessCms.tsx`
- Fixture-backed dashboard state as production logic
- Provider-specific Gemini UI contracts
