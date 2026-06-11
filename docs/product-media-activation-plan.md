# SALORA Product Media Activation Plan

Date: 2026-06-08

Scope: 12 P0 `ProductMediaDraft` records, ProductImage activation, Supabase storage, website/mobile image readiness.

No asset was uploaded. No draft was changed. No image row was created.

## Decision

MEDIA_WORKFLOW_BLOCKED

## Root Cause

Product media is blocked because:

1. The 12 P0 media drafts are still `DRAFT`.
2. Every P0 draft has `storagePath=null` and `publicUrl=null`.
3. `ProductImage` count is 0.
4. Read-only `storage.buckets` query returned `[]`, so no `product-images` bucket is visible in the active Supabase database.

## Required Products and Assets

| Priority | Product | Slug | Draft ID | Required Filename | Required Storage Path |
| ---: | --- | --- | --- | --- | --- |
| 1 | Spanish latte | `spanish-latte` | `e82be80e-9e97-4e2b-8f5b-e386a07df22a` | `spanish-latte-main-v1.webp` | `products/coffee/spanish-latte/main-v1.webp` |
| 2 | Pistachio latte | `pistachio-latte` | `ce72113c-3b1a-4b2d-8e6b-0eac1d1fa0cb` | `pistachio-latte-main-v1.webp` | `products/coffee/pistachio-latte/main-v1.webp` |
| 3 | Espresso cream | `espresso-cream` | `96703b27-bf60-4918-8d73-069bb35e158c` | `espresso-cream-main-v1.webp` | `products/coffee/espresso-cream/main-v1.webp` |
| 4 | Espresso Nutella | `espresso-nutella` | `48ded20c-e51b-41ef-9f6e-7eb34195af16` | `espresso-nutella-main-v1.webp` | `products/coffee/espresso-nutella/main-v1.webp` |
| 5 | Cold Brew | `cold-brew` | `bdc56f82-9b52-4552-8cb0-105c7405195e` | `cold-brew-main-v1.webp` | `products/specialty/cold-brew/main-v1.webp` |
| 6 | V60 | `v60` | `7cb6da05-6b13-443d-8b93-103dd50bc57d` | `v60-main-v1.webp` | `products/specialty/v60/main-v1.webp` |
| 7 | Franch Press | `franch-press` | `1514ddcb-01cd-4529-bb19-b5312ebfa70e` | `franch-press-main-v1.webp` | `products/specialty/franch-press/main-v1.webp` |
| 8 | Matcha coconut latte | `matcha-coconut-latte` | `475cb0d1-3122-4708-98ca-de8bb9bf96a4` | `matcha-coconut-latte-main-v1.webp` | `products/matcha/matcha-coconut-latte/main-v1.webp` |
| 9 | American cheese cake | `american-cheese-cake` | `3f1c226b-a17a-40d3-a179-0b8f15f8e8fd` | `american-cheese-cake-main-v1.webp` | `products/desserts/american-cheese-cake/main-v1.webp` |
| 10 | Tiramisu | `tiramisu` | `6352d91e-d976-41ac-b987-5c1e1b17a507` | `tiramisu-main-v1.webp` | `products/desserts/tiramisu/main-v1.webp` |
| 11 | Dubai cake | `dubai-cake` | `6e32a9d9-e11f-4db8-9938-f3c088ad8bac` | `dubai-cake-main-v1.webp` | `products/desserts/dubai-cake/main-v1.webp` |
| 12 | Iced pistachio latte | `iced-pistachio-latte` | `643634ae-cd32-4c1d-a476-edf009d958a2` | `iced-pistachio-latte-main-v1.webp` | `products/cold-coffee/iced-pistachio-latte/main-v1.webp` |

## Upload Sequence

1. Create or verify Supabase Storage bucket `product-images`.
2. Upload the 12 real `.webp` assets to the exact storage paths above.
3. Update each matching `ProductMediaDraft` with `storageBucket='product-images'`, `storagePath`, and approved `altText`.
4. Human review each draft.
5. Approve each draft.
6. Publish each approved draft.
7. Confirm one `ProductImage` per P0 product and `isPrimary=true`.
8. Verify website and mobile render primary images from the API/public menu.

## Publishing Sequence

Use existing Control Tower media workflow only:

```text
real uploaded asset
-> ProductMediaDraft storagePath/publicUrl
-> approve-draft
-> publish-draft
-> ProductImage created
-> primary image visible
```

## Blocker Removal Criteria

- `storage.buckets` contains `product-images`.
- 12 P0 drafts have non-null `storagePath` or `publicUrl`.
- 12 P0 drafts are `PUBLISHED`.
- `product_images` count for the P0 products is 12 or higher.
- Website product cards render actual image URLs.
- Mobile product views render API-backed images.

