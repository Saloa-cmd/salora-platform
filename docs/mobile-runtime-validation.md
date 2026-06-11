# SALORA Mobile Runtime Validation

Date: 2026-06-04  
Scope: `apps/mobile` API and database data flow.

## Executive Status

**PARTIAL**

## Mobile Flow Matrix

| Data | Status | Evidence |
|---|---|---|
| Menu | PARTIAL | `apps/mobile/app/(tabs)/menu.tsx` calls `/api/products` |
| Categories | PARTIAL | categories are derived from loaded products; no dedicated category runtime call verified |
| Prices | PARTIAL | prices come from product payload or fallback data |
| Availability | UNKNOWN | no verified mobile availability API call found |
| Promotions | UNKNOWN | no verified mobile promotions API call found |
| Images | PARTIAL | product visuals are present, but mobile uses fallback/static product data in multiple screens |
| Feature Flags | UNKNOWN | no verified mobile feature flag fetch found |

## API Client Evidence

- `apps/mobile/src/services/apiClient.ts` uses `EXPO_PUBLIC_API_URL` or defaults to `https://salora.cafe`.
- Menu screen calls `/api/products`.

## Fallback Evidence

Static data remains in mobile flows:
- `apps/mobile/app/(tabs)/home.tsx`
- `apps/mobile/app/(tabs)/concierge.tsx`
- `apps/mobile/app/product/[id].tsx`
- `apps/mobile/app/checkout.tsx`
- `packages/data/src/index.ts`

## Final Status

**PARTIAL**

Mobile is not fully connected to Supabase through APIs. Only the Menu screen has a verified API read path in code.
