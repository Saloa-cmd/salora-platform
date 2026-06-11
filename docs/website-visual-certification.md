# SALORA Website Visual Certification

Date: 2026-06-05  
Status: **PARTIAL**

## Evidence

| Requirement | Result | Evidence |
|---|---|---|
| Products from database | PASS | Supabase has 96 active products; public menu code reads `catalogProduct.findMany` |
| Product name | PASS | `/api/products` maps DB product names |
| Product price | PASS | public menu maps DB `basePrice` |
| Product description | PARTIAL | P0 AI descriptions are draft-only; catalog descriptions remain empty for many P0 products |
| Promotion | PARTIAL | 2 promotions exist, but public visual rendering of promotions is not certified |
| Product image | BLOCKED | `ProductImage` count is 0 |
| Mock menu avoided | PARTIAL | website still contains fallback to `@salora/data` on DB failure |

## Decision

**WEBSITE_PARTIAL**

Website can be commercially aligned after P0 images are published and draft descriptions are human-approved into catalog-facing content.

## Required Next Step

Publish at least the 12 P0 primary images through `ProductImage`, then run browser smoke on the public menu and verify image/name/price/description render from Supabase.
