# SALORA Phase 3 Domain Architecture Review

Date: 2026-05-31

## Executive Domain Analysis

SALORA is a premium cafe ecosystem, not only a menu and checkout app. The business platform must support guest identity, product catalog governance, ordering, stock visibility, loyalty, operational notifications, analytics, and future AI concierge intelligence.

## Domain Classification

Core domains:

- Customer: profile, preferences, addresses, favorites, saved orders.
- Product: category, product, variants, add-ons, modifiers, pricing, availability.
- Order: cart-to-order conversion, order lifecycle, timeline, notes, item snapshots.
- Inventory: ingredients, suppliers, stock movements, consumption, reorder thresholds.

Supporting domains:

- Loyalty: points ledger, rewards, redemptions.
- Notification: templates, delivery logs, channels.
- Analytics: event facts and reporting projections.
- RBAC/Auth: already established foundation.

Future domains:

- AI Concierge: recommendations, pairings, voice ordering, personalized offers.
- WhatsApp Automation: outbound templates, delivery receipts, customer messaging.
- Payments: authorization, capture, refunds, reconciliation.

## Aggregate Roots

- `CustomerProfile` owns addresses, preferences, favorites, saved orders, and loyalty account.
- `CatalogProduct` owns variants, modifiers, add-ons, pricing rules, and availability rules.
- `CafeOrder` owns order items, notes, and timeline entries.
- `Ingredient` owns stock movements and reorder policy.
- `NotificationTemplate` owns delivery logs through notifications.
- `LoyaltyAccount` owns ledger entries and redemptions.

## Domain Relationship Diagram

```text
User
  -> CustomerProfile
      -> CustomerAddress
      -> CustomerPreference
      -> CustomerFavorite
      -> SavedOrder
      -> LoyaltyAccount
          -> LoyaltyLedgerEntry
          -> RewardRedemption

ProductCategory
  -> CatalogProduct
      -> ProductVariant
      -> ProductModifier
      -> ProductAddon
      -> PricingRule
      -> AvailabilityRule

CustomerProfile
  -> CafeOrder
      -> OrderItem
      -> OrderTimeline
      -> OrderNote

Supplier
  -> Ingredient
      -> StockMovement
      -> ConsumptionRecord

NotificationTemplate
  -> Notification
      -> NotificationDeliveryLog
```

## Event Architecture

Events use past-tense business names and domain ownership:

- Customer: `CustomerRegistered`, `CustomerProfileUpdated`, `CustomerPreferenceUpdated`
- Product: `ProductCreated`, `ProductAvailabilityChanged`, `ProductPriceChanged`
- Order: `OrderCreated`, `OrderAccepted`, `OrderCompleted`, `OrderCancelled`
- Inventory: `StockMovementRecorded`, `InventoryLow`, `IngredientDepleted`
- Loyalty: `PointsAwarded`, `RewardRedeemed`
- Notification: `NotificationQueued`, `NotificationDelivered`, `NotificationFailed`

Consumers:

- Notification consumes customer/order/loyalty events.
- Inventory consumes order completion events.
- Loyalty consumes order completion events.
- Analytics consumes all domain events.
- Future AI consumes customer preference, order, product, and feedback events.

## API Governance

APIs are grouped by bounded context:

- `/api/customers/*`
- `/api/products/*`
- `/api/orders/*`
- `/api/inventory/*`
- `/api/loyalty/*`
- `/api/notifications/*`

Governance rules:

- All mutations validate with Zod.
- Staff/admin APIs require RBAC.
- Customer APIs scope to the authenticated user where possible.
- API responses include `requestId`.
- Domain services emit metrics and future domain events.
- No payment, WhatsApp, or AI provider calls in Phase 3.

## AI Readiness

Data required now for future AI:

- Stable product tags, pairing hints, modifiers, and availability.
- Customer preferences and favorites.
- Order history with item snapshots.
- Loyalty behavior and reward redemption.
- Notification engagement logs.
- Inventory availability signals.

No model provider is needed now. The schema must create clean training/retrieval surfaces later.

## Risks And Tradeoffs

- Risk: modeling too much too early. Mitigation: keep fields pragmatic and add JSON metadata only where useful.
- Risk: order lifecycle and payment lifecycle can be conflated. Mitigation: payments remain out of scope.
- Risk: inventory precision can overwhelm cafe operations. Mitigation: track ingredients and movements first.
- Risk: AI needs can distort transactional schema. Mitigation: event streams and order snapshots provide AI support without coupling.

## Implementation Roadmap

Phase 3.1 Customer: profile, address, preferences, favorites, saved orders.

Phase 3.2 Product: category, product, variants, modifiers, add-ons, pricing, availability.

Phase 3.3 Order: orders, items, notes, timeline.

Phase 3.4 Inventory: suppliers, ingredients, stock movements, consumption.

Phase 3.5 Loyalty: account, ledger, rewards, redemptions.

Phase 3.6 Notification: templates, notifications, delivery logs.

Complexity: medium-high. Migration impact: one additive Prisma migration with no destructive auth changes.
