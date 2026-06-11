# Website / App / Control Tower Sync Certification

Date: 2026-06-03

## Result

Status: CONNECTED

The website, mobile app, public API, and Control Tower now share the same database-backed product source for Simple Launch product data.

## Sync Matrix

| Area | Status | Evidence |
| --- | --- | --- |
| Control Tower products | CONNECTED | `/api/control-tower/simple-launch/products` reads/writes `catalog_products`. |
| Control Tower categories | CONNECTED | `/api/control-tower/simple-launch/categories` reads/writes `product_categories`. |
| Control Tower product images | CONNECTED | `/api/control-tower/simple-launch/product-images` manages URL-backed `product_images`. |
| Public product API | CONNECTED | `/api/products` reads active `catalog_products` through Prisma. |
| Website menu sections | CONNECTED | `apps/web/app/page.tsx` calls `getPublicMenuProducts()`. |
| Mobile menu | CONNECTED | `apps/mobile/app/(tabs)/menu.tsx` fetches `/api/products` using `saloraFetch`. |
| Prices | CONNECTED | Public menu mapping uses `catalog_products.base_price`. |
| Product images | PARTIAL | Existing image records are read when present; imported CSV had no image URLs, so no fake images were created. |
| Promotions/coupons | CONNECTED | Control Tower routes read/write `promotions` and `coupons`. |
| Feature flags | CONNECTED | Control Tower route reads/writes `feature_flags`. |

## Notes

- Website and mobile retain local fallback products only for offline/runtime failure resilience.
- The fallback does not create or seed database rows.
- Product image readiness remains a content asset gap, not a schema or Control Tower gap.
- No customer, order, payment, or secret data is exposed through the public product path.
