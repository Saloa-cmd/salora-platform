# SALORA Mobile Visual Certification

Date: 2026-06-05  
Status: **PARTIAL**

## Evidence

| Requirement | Result | Evidence |
|---|---|---|
| Mobile product list calls API | PASS IN CODE | `apps/mobile/app/(tabs)/menu.tsx` calls `/api/products` |
| Category filter uses runtime data | PASS IN CODE | categories derive from loaded products |
| Prices from runtime API | PARTIAL | API path can return DB products/prices; device smoke not executed |
| Images from runtime database | BLOCKED | `ProductImage` count is 0 |
| Promotions | UNKNOWN | no verified mobile promotion rendering path |
| Availability | UNKNOWN | no verified mobile availability rendering path |
| Fallback use | PARTIAL | Menu falls back on API failure; other screens still use static data |

## Decision

**MOBILE_PARTIAL**

Mobile cannot be visually certified until real ProductImage records exist and Expo/device runtime is tested against the soft-launch API.

## Required Next Step

After P0 ProductImage publishing, run device or simulator smoke with `EXPO_PUBLIC_API_URL` pointed to the runtime API and confirm P0 image/name/price/category rendering.
