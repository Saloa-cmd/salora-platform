# DEV to SALORA Data Mapping

## API Baseline

Requested SALORA API families:

- `/api/intelligence/*`
- `/api/payments/*`
- `/api/orders/*`
- `/api/customers/*`
- `/api/loyalty/*`
- `/api/ai/*`
- `/api/operations/*`

DEV currently exposes:

- `/api/health`, `/api/ready`, `/api/live`, `/api/runtime/inspect`, `/api/salora/health`, `/api/system/health`
- `/api/gemini/chat`, `/api/gemini/content`, `/api/gemini/visual`
- `/api/v1/auth/*`
- `/api/v1/orders`, `/api/v1/orders/:id/status`
- `/api/v1/products`, `/api/v1/products/:id/stock`
- `/api/v1/system/health`, `/api/v1/system/events`
- `/api/v1/diagnostics/*`
- `/api/v1/admin/queues`

## UI to API Mapping

| UI component | Required data | Existing DEV source | Existing SALORA-style API | Missing data / action |
|---|---|---|---|---|
| Executive revenue KPI | Today revenue, currency, growth %, comparison period | `DAILY_STATS_SUMMARY`, hard-coded `5,280.000 OMR` | Proposed `/api/payments/revenue/summary` | Need payment aggregation by day/channel/product/tax |
| Orders KPI | Total orders, growth, current queue counts | hard-coded `922`, `baristaOrders` | `/api/v1/orders` create/update only | Need `GET /api/orders/summary`, `GET /api/orders/live` |
| AI upsell KPI | AI-assisted orders, conversion rate, peak conversion | hard-coded `83.4%`, `SALES_METRICS` | Proposed `/api/intelligence/conversions` or `/api/ai/metrics` | Need tracked attribution model |
| Financial trend chart | Hourly OMR sales, conversion rate, order count | `SALES_METRICS` | Proposed `/api/payments/revenue/timeseries` | Need time-bucketed revenue read model |
| Product popularity donut | Product name, popularity score/share | `MENU_PRODUCTS` | `/api/v1/products` partial | Need popularity/units/revenue fields |
| Barista order stream | order id, item, details, table, time, status | local `baristaOrders` | `/api/v1/orders`, Socket.io runtime present | Need `GET /api/orders?status=active` and realtime `order.created/status.changed` |
| Audit ledger | time, actor, action, status | `AUDIT_LOGS`, local mutation | `/api/v1/system/events` | Need normalized `/api/operations/audit` with actor/resource/action/status |
| Health ticker | uptime, heap, node version, memory, security status | `/api/system/health` | `/api/v1/system/health`, `/api/health` | Consolidate endpoint shape |
| Diagnostics queue panel | queue counts, DLQ count, heartbeat state | diagnostics controller | `/api/v1/diagnostics/queue`, `/api/v1/diagnostics/queue/dlq`, `/api/v1/diagnostics/heartbeats` | Add UI adapter and auth |
| Regression test simulator | test names, status, latency | local state | None | Optional: `/api/operations/quality-runs` |
| Accessibility controls | text scale, contrast, reduced motion | local state | None | Add user preference storage if needed |
| AI chat | message, history, personality, tone, language | `/api/gemini/chat` | Proposed `/api/ai/chat` | Abstract provider and store conversation metadata |
| AI content | content type, prompt, product, language, tone | `/api/gemini/content` | Proposed `/api/ai/content/generate` | Add templates, approval workflow, campaign linkage |
| AI visual | campaign type, style, description, generated spec | `/api/gemini/visual` | Proposed `/api/ai/visual/specs` | Add JSON schema, asset persistence |
| AI tuner | personality, tone, language, intensity, upsell, memory | local state | Proposed `/api/ai/config` | Need persistent AI config records; Prisma has `AIConfig` |
| CMS theme controls | theme, accent, slogans, promo text, layout blocks | local state | Proposed `/api/operations/app-config` or `/api/intelligence/experience-config` | Need app config model/versioning |
| Product editor | product id/name/Arabic name/price/category/popularity/visibility | `MENU_PRODUCTS`, local table | `/api/v1/products` | Need update/delete/list pagination and fields aligned to UI |
| Campaign editor | campaign title, incentive, multiplier, status | local table | Proposed `/api/operations/campaigns` | Need campaign model/API |
| Prompt store | purpose, directive, temperature, active | local table | Prisma `AIConfig` exists | Need `/api/ai/prompts` CRUD |
| Media assets | filename, size, encryption, tag, preview | local table, missing `/store_assets/*` | Proposed `/api/operations/media` | Need asset storage and signed URLs |
| Notifications table | subject, audience, channel, sent count | local table | notification routes exist but not mounted in `routes.ts` | Mount `/api/v1/notifications` or map to `/api/operations/notifications` |
| Loyalty wallet | points, tier, multiplier, streak, QR/pass id | local state | loyalty routes exist but not mounted in `routes.ts` | Mount `/api/v1/loyalty` and/or add `/api/loyalty/profile` |
| Customer intelligence | reviews, sentiment category, drafted reply | local reviews + `/api/gemini/content` | Proposed `/api/customers/reviews`, `/api/ai/review-reply` | Need review ingestion and sentiment API |
| WhatsApp simulator | conversation logs, AI bot replies, order intent | local state | Proposed `/api/customers/whatsapp`, `/api/operations/messages` | Need WhatsApp integration contracts |
| NFC table emulator | table id, routing type, active alert | local state | Proposed `/api/operations/tables` | Need table/session model |
| Wallet pass preview | tier, points, QR/hash | local state | Proposed `/api/loyalty/wallet-pass` | Need PassKit/Google Wallet backend |

## Contract Gap Summary

Existing usable APIs:

- Health/runtime: strong but endpoint shapes need consolidation.
- Orders/products: core mutations exist under `/api/v1`.
- Diagnostics/admin queues: backend exists; UI not yet bound.
- AI generation: works but provider-specific `/api/gemini/*`.

Missing or incomplete for SALORA command center:

- Revenue and payment analytics.
- Customer intelligence and review ingestion.
- Loyalty profile/pass APIs mounted into main router.
- Notifications APIs mounted into main router.
- Operations audit and staff action log.
- Campaign management.
- App configuration/versioning.
- AI prompt/config persistence.
- Realtime dashboard read models.

## Recommended SALORA API Contracts

```http
GET /api/intelligence/executive-summary
GET /api/payments/revenue/summary?range=today
GET /api/payments/revenue/timeseries?bucket=hour
GET /api/orders/summary
GET /api/orders/live
GET /api/customers/segments
GET /api/customers/reviews
GET /api/loyalty/summary
GET /api/loyalty/wallet-pass/:customerId
POST /api/ai/chat
POST /api/ai/content/generate
POST /api/ai/visual/spec
GET /api/ai/config
PATCH /api/ai/config
GET /api/operations/health
GET /api/operations/audit
GET /api/operations/queues
GET /api/operations/app-config
PATCH /api/operations/app-config
```
