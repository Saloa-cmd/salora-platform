# SALORA Mobile Runtime Certification

Date: 2026-06-08

Scope: `apps/mobile`, product rendering, API-backed menu/home screens, static data remnants, checkout/cart/concierge behavior.

No mobile code was changed.

## Decision

PARTIAL

Mobile home and menu screens use `/api/products` and expose loading/error/runtime state, but key flows still depend on local `@salora/data` static/domain data. The mobile app is not fully synchronized with the live catalog/order runtime.

## Evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Home product API | `apps/mobile/app/(tabs)/home.tsx` uses `/api/products` | PASS in code |
| Menu product API | `apps/mobile/app/(tabs)/menu.tsx` uses `/api/products` | PASS in code |
| Loading/error/runtime state | Home/menu expose loading, error, stale, and source visibility | PASS in code |
| Product detail | `apps/mobile/app/product/[id].tsx` imports `getProductById` and `products` from `@salora/data` | PARTIAL |
| Concierge | `apps/mobile/app/(tabs)/concierge.tsx` imports `products` and `recommendFromPrompt` from `@salora/data` | PARTIAL |
| Checkout | `apps/mobile/app/checkout.tsx` creates local WhatsApp order drafts and labels action `Confirm mock order` | BLOCKER for commercial order flow |
| Cart | `apps/mobile/app/(tabs)/cart.tsx` relies on local cart calculations from `@salora/data` | PARTIAL |
| Product images | Live `ProductImage` count is 0 | BLOCKER for real mobile product media |

## Required Actions

1. Replace product detail static fallback with `/api/products` or a product-detail API.
2. Replace local concierge product recommendations with API-backed product context and OpenAI runtime gating.
3. Replace mock checkout wording and local WhatsApp draft with certified COD/order lifecycle APIs.
4. Verify mobile against a real API host with loading, stale, offline, and error behavior.
5. Re-test after ProductImage records exist.

