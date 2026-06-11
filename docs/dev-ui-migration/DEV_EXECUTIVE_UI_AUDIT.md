# DEV Executive UI Audit

Source system: DEV at `C:\dev\salora-café`  
Target platform: SALORA  
Audit date: 2026-05-31  
Scope: executive dashboards, control centers, analytics/admin/AI studio interfaces, monitoring surfaces, mobile simulator screens, reusable widgets, layout system, and design assets.

## Executive Finding

DEV is a mature executive command-center prototype built as a Vite React single-page application with lazy-loaded operating rooms, an Express backend, Prisma/PostgreSQL schema, Redis/BullMQ runtime hooks, Socket.io, observability modules, a Storybook-ready design-system folder, and an Expo mobile workspace. It is reusable as a UX and interaction source system, but not as a direct drop-in module.

The strongest reusable value is in dashboard information architecture, visual language, control room composition, Recharts-based analytics patterns, mobile simulator patterns, AI studio interaction models, and operational widgets. The weakest area is data contract maturity: many panels still rely on local fixture arrays or ad hoc `/api/gemini/*` and `/api/system/health` endpoints rather than normalized SALORA APIs.

## Feature Inventory

| Capability | Route / Entry | Main files | Dependencies | Complexity | Migration difficulty | Reuse score |
|---|---|---|---|---:|---:|---:|
| Executive shell, sidebar, telemetry ribbon, role switcher | SPA root; tab state in `src/App.tsx` | `src/App.tsx`, `src/index.css`, `src/locales.ts`, `src/demoData.ts` | React, Tailwind v4 alpha, lucide-react | Medium | Medium | 8/10 |
| Command Deck / executive overview | `activeTab='overview'` | `src/components/CommandDeck.tsx` | Recharts, demo metrics | Medium | Low-medium | 9/10 |
| Platform health and analytics room | `activeTab='analytics'` | `src/components/AnalyticsPanel.tsx` | Recharts, `/api/system/health` | Medium | Medium | 8/10 |
| Enterprise Architect / admin command center | `activeTab='architect'` | `src/components/EnterpriseArchitect.tsx` | Health API, Gemini content endpoint, many local simulators | High | Medium-high | 8/10 |
| Headless CMS and mobile app sync | `activeTab='cms'` | `src/components/HeadlessCms.tsx`, `DatabaseStudio.tsx`, `AppleIosHub.tsx` | Local state, Unsplash image URLs, simulator events | High | Medium-high | 9/10 UX, 5/10 data |
| Database governance console | CMS subtab `database` | `src/components/DatabaseStudio.tsx` | Local tables, local snapshot state | High | Medium | 8/10 |
| iOS / Siri / Wallet hub | CMS subtab `ios_hub` | `src/components/AppleIosHub.tsx` | Local state, lucide icons | Medium | Medium | 7/10 |
| AI Executive Brain | `activeTab='chat'` | `src/components/AIBrain.tsx` | `/api/gemini/chat`, tuner state | Medium | Medium | 8/10 |
| AI Content Studio | `activeTab='content'` | `src/components/AIContentStudio.tsx` | `/api/gemini/content`, Clipboard API | Medium | Medium | 8/10 |
| AI Visual Hub | `activeTab='visual'` | `src/components/AIVisualHub.tsx` | `/api/gemini/visual`, JSON output | Medium | Medium | 7/10 |
| AI Personality Tuner | `activeTab='tuner'` | `src/components/AiTuner.tsx` | shared tuner state | Low-medium | Low | 9/10 |
| Automation engine / workflow matrix | `activeTab='automation'` | `src/components/AutomationEngine.tsx` | local automation rules | Low-medium | Low-medium | 8/10 |
| Brand media library | `activeTab='media'` | `src/components/MediaLibrary.tsx` | external images, referenced local asset paths | Low | Low-medium | 6/10 |
| Team roster / RBAC profile cards | `activeTab='team'` | `src/components/TeamRoster.tsx`, `src/demoData.ts` | local role fixtures | Low | Low | 8/10 |
| Grafana queue dashboard | external observability | `grafana/dashboards/queue-overview.json` | Prometheus/BullMQ metrics | Low | Medium | 7/10 |
| Mobile customer app screens | Expo routes | `mobile/app/**`, `mobile/components/**` | Expo Router, NativeWind, Zustand, React Query | Medium-high | Medium | 7/10 |

## Screenshots / Visual References

No committed screenshot image files were found in the project tree. Available visual references are source-rendered:

| Screen | Reference |
|---|---|
| Executive shell | `src/App.tsx` |
| Command deck | `src/components/CommandDeck.tsx` |
| Analytics room | `src/components/AnalyticsPanel.tsx` |
| Mobile simulator | `src/components/HeadlessCms.tsx` |
| Database studio | `src/components/DatabaseStudio.tsx` |
| Built assets | `dist/assets/*.js`, `dist/assets/index-DDIwiPrp.css` |

`MediaLibrary` and `HeadlessCms` reference `/store_assets/*` paths and several Unsplash URLs, but no matching committed `public/store_assets` images were found in the inspected tree.

## Reusable Layouts and Widgets

| Widget / layout | Source | Recommended SALORA role |
|---|---|---|
| Executive shell with sidebar and top telemetry ribbon | `src/App.tsx` | Base `DashboardShell` after decoupling tab state into routing |
| Metric cards | `CommandDeck`, `AnalyticsPanel` | `KpiCard`, `RevenueCard`, `MetricWidget` |
| Recharts area and pie panels | `CommandDeck`, `AnalyticsPanel` | `ChartWidget` library |
| Audit ledger | `CommandDeck`, `EnterpriseArchitect`, `DatabaseStudio` | `AuditLogFeed` |
| Barista order stream | `CommandDeck`, `HeadlessCms` | `OperationsQueueWidget` |
| Mobile phone simulator | `HeadlessCms` | `MobilePreviewSimulator` |
| Database table studio | `DatabaseStudio` | `AdminDataGrid` after API rewrite |
| AI prompt parameter panel | `AIBrain`, `AiTuner`, `AIContentStudio` | `AIControlPanel` |
| Workflow matrix | `AutomationEngine` | `WorkflowMapWidget` |
| Wallet pass mock | `AppleIosHub`, `EnterpriseArchitect` | `LoyaltyPassPreview` |

## Dependency Audit

Core UI dependencies: React 18, React DOM, Vite, Tailwind CSS v4 alpha, lucide-react, Recharts, React Router dependency present but not used for dashboard routing.

Operational dependencies affecting UI migration: Express, Zod, Google GenAI SDK, Prisma, Redis/ioredis, BullMQ, Socket.io, OpenTelemetry, Sentry, Prometheus, Stripe packages, Firebase Admin.

Mobile dependencies: Expo 56, Expo Router, NativeWind, Zustand, React Query, Sentry React Native, Expo Secure Store and Notifications.

## Reuse Assessment

DEV UI maturity: high for executive visual composition, medium for implementation architecture, low-medium for production data binding.

Reuse principle: migrate designs and component patterns first; then map to SALORA APIs and state ownership. Do not copy the monolithic `App.tsx` tab shell directly into SALORA.

Immediate reuse candidates:

- Command Deck layout and KPI/chart widgets.
- Analytics room visual composition.
- AI Tuner controls.
- Audit ledger and order stream.
- Mobile simulator layout.
- Database studio table patterns.
- Design tokens and glass panel utilities after token normalization.

Highest risks:

- API namespace mismatch: frontend uses `/api/system/health` while central routes mount many backend APIs under `/api/v1`.
- Fixture-heavy data: `demoData.ts` drives most dashboards.
- Large monolithic components: `EnterpriseArchitect.tsx` and `HeadlessCms.tsx` need decomposition before reuse.
- Encoding artifacts in Arabic strings and icon labels need cleanup before SALORA standardization.
