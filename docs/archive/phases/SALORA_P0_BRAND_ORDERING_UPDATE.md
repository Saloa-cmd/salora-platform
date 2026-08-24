# SALORA P0 Brand & Ordering Update

## Implemented

- Official SALORA dark logo used in the web menu, mobile brand header, and Control Tower.
- Arabic-first mobile home and menu experience.
- Customer-facing runtime diagnostics removed from mobile screens.
- Mobile menu search and clearer loading, empty, and error states.
- Premium RTL product cards with OMR pricing.
- Four service modes shared across web/mobile order contracts: counter, car, dine-in, and gift.
- Arabic WhatsApp order message with line totals and OMR total.
- Arabic checkout and product detail experience.
- Direct customer-menu preview link in Control Tower.

## Verification

- `pnpm typecheck`: passed.
- `pnpm lint`: passed with zero warnings.
- `pnpm build:web`: passed; all 35 pages generated.
- Test suite progressed through data and auth checks, then stopped because `.env.example` was excluded from the uploaded source archive.
- Runtime used for this verification was Node 24; the project and CI remain pinned to Node 22.

## P1 priorities

1. Store product modifiers as structured database records instead of UI-only rules.
2. Persist selected modifiers and service-mode metadata as structured order item data.
3. Add customer-visible availability, allergens, nutrition, and scheduling.
4. Add Control Tower CRUD for modifier groups and branch availability.
5. Run Expo device smoke tests using the certified Node 22 environment.
