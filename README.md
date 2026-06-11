# SALORA / Salora.Cafe

Phase 1 foundation for a premium AI-powered cafe platform: cinematic web, Expo mobile shell, shared data/types/design tokens, WhatsApp-ready ordering, AI concierge mock logic, loyalty preview, and production planning docs.

This is intentionally local-first. Phase 1 does not include a real backend, payments, WhatsApp Cloud API, Instagram API, or production AI API.

## Structure

```txt
salora-platform/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── admin/
├── packages/
│   ├── ui/
│   ├── config/
│   ├── types/
│   └── data/
└── docs/
```

## Run

```bash
pnpm install
pnpm dev:web
pnpm dev:mobile
```

## Phase 1 Includes

- Next.js App Router landing page with Framer Motion and Lucide icons.
- Expo Router mobile app shell with menu, product details, cart, checkout, tracking, profile, offers, AI concierge, and loyalty preview.
- Zustand cart store and React Hook Form checkout.
- Local mock products, order types, AI concierge rules, and WhatsApp message generation.
- Future admin dashboard notes and Supabase integration plan.

## Phase 2 Not Included

Supabase database, authentication, real order management, real WhatsApp Cloud API, Instagram automation, payment integration, real AI API, loyalty engine, analytics, and push notifications are planned but not implemented.
