# SALORA UI Migration Strategy

## Strategy

Migrate DEV dashboards into SALORA as a sequence of API-backed command-center capabilities. Preserve SALORA architecture by extracting component patterns, not copying full files. Each wave should end with a usable dashboard, typed contracts, and production-safe empty/loading/error states.

## Wave 1: Executive Dashboard

Effort: 4-6 engineering days  
Risk: Medium  
Estimated value: Very high  
Source: `CommandDeck.tsx`, KPI patterns from `AnalyticsPanel.tsx`, shell from `App.tsx`

Dependencies:

- `/api/intelligence/executive-summary`
- `/api/payments/revenue/summary`
- `/api/orders/summary`
- `/api/operations/audit`

Deliverables:

- SALORA `DashboardShell`
- KPI card set
- Revenue trend chart
- Live order summary
- Audit feed

## Wave 2: Revenue Center

Effort: 5-8 engineering days  
Risk: Medium-high  
Estimated value: High  
Source: Command Deck financial chart, Analytics product popularity, Enterprise Architect pricing logic, AI Content campaign actions

Dependencies:

- Payment/revenue read models
- Product/category revenue aggregation
- Campaign attribution data

Deliverables:

- Revenue dashboard
- Product mix chart
- Average basket and conversion cards
- Campaign impact panels

## Wave 3: Operations Center

Effort: 6-10 engineering days  
Risk: High  
Estimated value: High  
Source: Barista order stream, Automation Engine, Database Studio inventory patterns, diagnostics APIs

Dependencies:

- Live order feed
- Product/inventory APIs
- Queue and runtime diagnostics
- Realtime event contracts

Deliverables:

- Operations queue
- Inventory health
- Automation rules panel
- Queue/heartbeat monitoring
- Audit log integration

## Wave 4: AI Center

Effort: 6-9 engineering days  
Risk: Medium-high  
Estimated value: High  
Source: AI Brain, Content Studio, Visual Hub, AI Tuner, prompt store table

Dependencies:

- `/api/ai/chat`
- `/api/ai/content/generate`
- `/api/ai/visual/spec`
- `/api/ai/config`
- Prompt and generation persistence

Deliverables:

- AI executive chat
- Content generation studio
- Visual specification studio
- Tuner/config panel
- AI prompt governance table

## Wave 5: Customer Intelligence

Effort: 7-12 engineering days  
Risk: High  
Estimated value: High  
Source: Headless CMS loyalty/mobile preview, Apple iOS Hub, Enterprise Architect WhatsApp/review modules

Dependencies:

- `/api/customers/*`
- `/api/loyalty/*`
- Review ingestion
- WhatsApp/message integration
- Wallet pass service if included

Deliverables:

- Customer segments and loyalty summary
- Reviews and AI reply drafting
- WhatsApp command dashboard
- Loyalty pass preview

## Wave 6: Mobile Executive Dashboard

Effort: 5-9 engineering days  
Risk: Medium  
Estimated value: Medium-high  
Source: Headless CMS phone simulator and Expo mobile primitives

Dependencies:

- App configuration API
- Mobile content blocks API
- Feature flag/config versioning

Deliverables:

- Web-based mobile preview simulator
- App configuration controls
- Live activity preview
- Expo/mobile design token alignment

## Service Boundaries

| Service boundary | Owned APIs | UI consumers |
|---|---|---|
| Intelligence | `/api/intelligence/*` | Executive, AI, Customer |
| Revenue | `/api/payments/*`, payment projections | Executive, Revenue |
| Orders and Operations | `/api/orders/*`, `/api/operations/*` | Executive, Operations, Monitoring |
| Customers and Loyalty | `/api/customers/*`, `/api/loyalty/*` | Customer, WhatsApp, Mobile Preview |
| AI Gateway | `/api/ai/*` | AI Dashboard, Revenue content, Customer replies |
| Admin/RBAC | roles, permissions, audit | Administration, all gated actions |

## Deployment Strategy

- Keep DEV and SALORA separate during extraction.
- Introduce components behind SALORA feature flags.
- Deploy Wave 1 behind internal-only access first.
- Add read-only dashboards before write-capable admin controls.
- Move write actions into audited server endpoints only.

## Observability Strategy

- Track dashboard API latency, error rate, and stale data age.
- Emit audit events for all write actions.
- Add frontend telemetry for dashboard load failures.
- Use Prometheus metrics and Grafana queue dashboard after metric names are aligned.
- Add SLOs for executive dashboard freshness and operations queue lag.

## Execution Sequence

1. Create SALORA dashboard shell and token bridge.
2. Build API adapters for executive summary, revenue, orders, and audit.
3. Migrate Wave 1 UI patterns.
4. Normalize chart and metric components.
5. Add waves in order, always replacing fixtures with contracts before release.
