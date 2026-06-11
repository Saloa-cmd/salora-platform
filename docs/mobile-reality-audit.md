# SALORA Mobile Reality Audit

Date: 2026-06-04  
Scope: `apps/mobile`, API client, menu/home/product/checkout flows, fallback behavior.

## Executive Finding

Mobile state is **PARTIAL**.

## Mobile Data Reality

| Requirement | Status | Evidence |
|---|---|---|
| Mobile reads API | PARTIAL | `apps/mobile/src/services/apiClient.ts` uses `EXPO_PUBLIC_API_URL` or `https://salora.cafe` |
| Mobile reads products | PARTIAL | `apps/mobile/app/(tabs)/menu.tsx` calls `/api/products` |
| Mobile reads categories | PARTIAL | Categories are derived from loaded products in Menu; no standalone category API usage verified |
| Mobile reads inventory | NO | No verified inventory API read path in mobile screens |
| Fallback usage | ACTIVE | Menu initializes from `@salora/data`; Home, Concierge, Product, and Checkout use static data |
| Offline behavior | PARTIAL | Static fallback exists, but no verified offline cache/sync system was found |
| Order submission | PARTIAL | Checkout builds WhatsApp URL / mock confirmation; no verified production order API submission |

## File Evidence

- API client: `apps/mobile/src/services/apiClient.ts`
- Menu API read and fallback: `apps/mobile/app/(tabs)/menu.tsx`
- Static home products: `apps/mobile/app/(tabs)/home.tsx`
- Static concierge recommendations: `apps/mobile/app/(tabs)/concierge.tsx`
- Static product detail: `apps/mobile/app/product/[id].tsx`
- Mock/WhatsApp checkout path: `apps/mobile/app/checkout.tsx`

## Mobile Conclusion

The mobile app is not production-ready as a live commerce client. It can read `/api/products` on the menu screen, but core flows still rely on static fallback data and mock/WhatsApp checkout behavior.
