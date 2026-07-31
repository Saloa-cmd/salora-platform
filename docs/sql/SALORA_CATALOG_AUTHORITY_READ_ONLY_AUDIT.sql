-- SALORA catalog authority audit
-- READ ONLY: this file contains SELECT statements only.
-- It does not mutate categories, products, media, pricing, inventory, or publications.

SELECT
  c.slug,
  c.name_ar,
  c.name_en,
  c.brand_key,
  c.sort_order,
  COUNT(p.id) AS total_products,
  COUNT(p.id) FILTER (WHERE p.status = 'ACTIVE') AS active_products,
  COUNT(p.id) FILTER (WHERE p.status = 'DRAFT') AS draft_products,
  COUNT(p.id) FILTER (WHERE p.status = 'PAUSED') AS paused_products,
  COUNT(p.id) FILTER (WHERE p.status = 'ARCHIVED') AS archived_products
FROM public.product_categories c
LEFT JOIN public.catalog_products p
  ON p.category_id = c.id
 AND p.brand_key = 'SALORA'
WHERE c.brand_key IN ('SALORA', 'LEGACY')
GROUP BY c.id, c.slug, c.name_ar, c.name_en, c.brand_key, c.sort_order
ORDER BY c.brand_key, c.sort_order, c.slug;

SELECT
  COUNT(*) FILTER (WHERE brand_key = 'SALORA') AS salora_categories,
  COUNT(*) FILTER (WHERE brand_key = 'LEGACY') AS legacy_categories
FROM public.product_categories;

SELECT status, COUNT(*) AS products
FROM public.catalog_products
WHERE brand_key = 'SALORA'
GROUP BY status
ORDER BY status;

SELECT
  COUNT(*) AS salora_products,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_products,
  COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_products
FROM public.catalog_products
WHERE brand_key = 'SALORA';

SELECT c.slug, c.name_ar, c.name_en
FROM public.product_categories c
LEFT JOIN public.catalog_products p
  ON p.category_id = c.id
 AND p.brand_key = 'SALORA'
WHERE c.brand_key = 'SALORA'
GROUP BY c.id, c.slug, c.name_ar, c.name_en
HAVING COUNT(p.id) = 0
ORDER BY c.slug;

SELECT p.slug, p.name_ar, p.name_en, p.status, c.slug AS category_slug
FROM public.catalog_products p
JOIN public.product_categories c ON c.id = p.category_id
WHERE p.brand_key = 'SALORA'
  AND c.brand_key <> 'SALORA'
ORDER BY p.slug;
