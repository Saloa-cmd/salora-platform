# P0 Mobile API Certification

Date: 2026-06-07

## Scope

P0-3 Mobile API Authority.

## Changes

- `apps/mobile/app/(tabs)/home.tsx` no longer imports static `@salora/data` products.
- `apps/mobile/app/(tabs)/menu.tsx` no longer initializes or silently falls back to static `@salora/data` products.
- Both screens now call `/api/products` through the existing `saloraFetch()` client.
- Both screens expose loading, error, empty, stale, and runtime source visibility.

## Certification Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| Replace static product rendering | PASS | Product lists are populated from `/api/products`; no static product import remains in home/menu. |
| Loading state | PASS | Home and menu render `ActivityIndicator` with live loading text. |
| Error state | PASS | API and network failures render visible unavailable states. |
| Stale state | PASS | Runtime panel displays `Stale: yes/no`. |
| Runtime source visibility | PASS | Runtime panel displays source and mode from API runtime metadata. |
| No mock records | PASS | No synthetic product arrays were added. |

## Notes

`/api/products` remains the authority for mobile product rendering. If the public menu backend falls back to static data, the API marks it through runtime metadata; the mobile UI now makes that visible instead of hiding it.

## Status

MOBILE_API_AUTHORITY_FIXED
