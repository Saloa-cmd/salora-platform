# DEV Dashboard Inventory

## Dashboard Index

| Dashboard | Route / activation | Classification | Purpose | Data sources | APIs used | Dependencies | Widgets |
|---|---|---|---|---|---|---|---|
| Command Deck | SPA root, `activeTab='overview'` | Executive, Operations, Revenue, Customer, Analytics | Executive overview of revenue, orders, upsell rate, environmental demand, live orders, audit logs | `SALES_METRICS`, `MENU_PRODUCTS`, `AUDIT_LOGS`, local `baristaOrders` | None directly | React, Recharts, lucide | KPI cards, AreaChart, order stream, audit ledger |
| Analytics Panel | `activeTab='analytics'` | Monitoring, Analytics, Operations | Platform health, runtime metrics, regression test simulator, telemetry log stream, accessibility controls | `/api/system/health`, local FPS/ping/test state, `SALES_METRICS`, `MENU_PRODUCTS` | `GET /api/system/health` | Recharts, lucide | status ticker, area chart, pie chart, test runner, log feed, accessibility controls |
| Enterprise Architect | `activeTab='architect'` | Executive, Operations, AI, Monitoring, Customer, Revenue | System architect clinic: health, RBAC/JWT, predictive pricing/inventory, review responses, WhatsApp/NFC/wallet, schema/API docs, CI/security tests | `/api/system/health`, `/api/gemini/content`, local review/WhatsApp/pricing/test fixtures | `GET /api/system/health`, `POST /api/gemini/content` | lucide, local state | module tabs, health card, token rotator, pricing calculator, inventory forecast, review reply generator, WhatsApp simulator, NFC table emulator, wallet pass, schema viewer, test suite |
| Headless CMS & App Sync | `activeTab='cms'`, subtab `composer` | Operations, Customer, Inventory, Mobile | Remote mobile app composer, theme and content controls, live phone simulator, layout block reorder, product visibility/pricing | `MENU_PRODUCTS`, local CMS state, `baristaOrders`, locale strings | None directly | lucide, external image URLs | theme picker, block sequence list, phone app preview, dynamic island, product cards, loyalty widget, live activity lock screen |
| Database Studio | `activeTab='cms'`, subtab `database` | Administration, Inventory, Customer, AI | Supabase-like governance studio for products, categories, campaigns, prompts, media, notifications, snapshots, RBAC | local table state seeded from `MENU_PRODUCTS` | None directly | lucide | table tabs, searchable data grid, add row modal, snapshots, integrity auditor, RBAC selector |
| Apple iOS Hub | `activeTab='cms'`, subtab `ios_hub` | Customer, Mobile, Operations | Apple Wallet pass, Siri shortcut simulator, custom icon pack | local loyalty and order state | None directly | lucide | wallet card, Siri shortcuts, voice waveform, icon grid |
| AI Brain | `activeTab='chat'` | AI, Executive | Executive assistant chat with tuner-aware prompts and preset strategy queries | `CHAT_PRESETS`, shared tuner state, chat state | `POST /api/gemini/chat` | lucide | chat message stream, prompt preset deck, tuner summary |
| AI Content Studio | `activeTab='content'` | AI, Revenue, Customer | Generate premium campaign copy, scripts, WhatsApp content | `CONTENT_PRESETS`, `MENU_PRODUCTS`, shared tuner state | `POST /api/gemini/content` | lucide, Clipboard API | preset selector, product selector, prompt editor, output canvas, WhatsApp syndication action |
| AI Visual Hub | `activeTab='visual'` | AI, Revenue, Customer | Generate creative visual specs and image-engine prompts | `VISUAL_PRESETS`, shared tuner state | `POST /api/gemini/visual` | lucide, Clipboard API | prompt selector, style panel, JSON result card, palette swatches, prompt copy |
| Automation Engine | `activeTab='automation'` | Operations, Customer, AI | Configure campaign/temperature/inventory automation rules and visualize workflow | local `automationRules` | None directly | lucide | rule cards, toggles, workflow matrix |
| AI Tuner | `activeTab='tuner'` | AI, Administration | Tune personality, tone, language, recommendation, upsell, and memory controls | shared tuner state | None directly | lucide | select controls, sliders, prompt blueprint, recompile action |
| Media Library | `activeTab='media'` | Administration, Revenue | Brand asset selection and soundboard | local asset paths, external image URLs | None directly | React | asset list, preview canvas, soundboard |
| Team Roster | `activeTab='team'` | Administration | Role profiles and access responsibilities | `TEAM_ROLES` | None directly | lucide | role cards, responsibility lists |
| Bull Board queue admin | `/api/v1/admin/queues` backend mount | Monitoring, Administration | Queue UI for BullMQ jobs | `jobsQueue` | `GET/POST` Bull Board routes behind auth | `@bull-board/api`, `@bull-board/express`, BullMQ | queue dashboard |
| Grafana queue dashboard | Grafana JSON | Monitoring | Queue overview for Prometheus metrics | Prometheus `/metrics` | `/metrics` | Grafana, Prometheus | queue panels |

## Data Source Notes

Most dashboard views are currently fixture-backed. The primary fixture file is `src/demoData.ts`, which includes:

- `TEAM_ROLES`
- `MENU_PRODUCTS`
- `SALES_METRICS`
- `DAILY_STATS_SUMMARY`
- `AUDIT_LOGS`
- `CHAT_PRESETS`
- `CONTENT_PRESETS`
- `VISUAL_PRESETS`

The only live UI API calls found in dashboard components are:

- `GET /api/system/health`
- `POST /api/gemini/chat`
- `POST /api/gemini/content`
- `POST /api/gemini/visual`

The backend also exposes the richer `/api/v1` namespace:

- `/api/v1/auth/login`
- `/api/v1/auth/refresh`
- `/api/v1/auth/logout`
- `/api/v1/orders`
- `/api/v1/orders/:id/status`
- `/api/v1/products`
- `/api/v1/products/:id/stock`
- `/api/v1/system/health`
- `/api/v1/system/events`
- `/api/v1/diagnostics/*`
- `/api/v1/admin/queues`

## Dashboard Classification Summary

Executive: Command Deck, Enterprise Architect, AI Brain.  
Operations: Command Deck, Headless CMS, Automation Engine, Enterprise Architect.  
Revenue: Command Deck, AI Content Studio, AI Visual Hub, Enterprise Architect pricing module.  
AI: AI Brain, AI Content Studio, AI Visual Hub, AI Tuner, Enterprise Architect.  
Customer: Headless CMS, Apple iOS Hub, Enterprise Architect WhatsApp/NFC/Wallet, Team Roster.  
Inventory: Database Studio, Command Deck, Enterprise Architect inventory forecast.  
Monitoring: Analytics Panel, Enterprise Architect, Bull Board, Grafana queue dashboard.  
Analytics: Command Deck, Analytics Panel, Enterprise Architect.
