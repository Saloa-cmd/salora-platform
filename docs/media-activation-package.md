# SALORA Media Activation Package

Date: 2026-06-08

Scope:

- `docs/product-media-activation-plan.md`
- Supabase storage requirements
- P0 image naming and metadata
- Control Tower publish workflow

No bucket was created. No image was uploaded. No draft was modified. No `ProductImage` was created.

## Decision

MEDIA_BLOCKED

The production upload package is complete, but execution is blocked until the `product-images` bucket exists and the 12 real P0 assets are available.

## Current Evidence

| Check | Result |
| --- | --- |
| `ProductMediaDraft` records | 12 |
| Draft status | all `DRAFT` |
| Draft `storagePath` | all null |
| Draft `publicUrl` | all null |
| `ProductImage` records | 0 |
| `storage.buckets` query | empty list |

## Required Bucket

| Setting | Requirement |
| --- | --- |
| Bucket name | `product-images` |
| Asset type | Real approved product photography only |
| Format | `.webp` preferred |
| Placeholder/fake URLs | Forbidden |
| Public access | Must match website/mobile image delivery strategy |
| Access policy | Must allow controlled upload by approved operators and public read only where intended |

## Required Metadata Per Asset

| Field | Requirement |
| --- | --- |
| `storageBucket` | `product-images` |
| `storagePath` | Exact approved path from P0 plan |
| `publicUrl` | Optional if storage delivery resolves URL elsewhere; required if public menu needs direct URL |
| `altText` | Human-approved descriptive product alt text |
| `isPrimaryCandidate` | true for each P0 hero image |
| `source` | `manual` or approved source; AI prompt remains draft only |

## Required Assets

| Product | Filename | Storage Path |
| --- | --- | --- |
| Spanish latte | `spanish-latte-main-v1.webp` | `products/coffee/spanish-latte/main-v1.webp` |
| Pistachio latte | `pistachio-latte-main-v1.webp` | `products/coffee/pistachio-latte/main-v1.webp` |
| Espresso cream | `espresso-cream-main-v1.webp` | `products/coffee/espresso-cream/main-v1.webp` |
| Espresso Nutella | `espresso-nutella-main-v1.webp` | `products/coffee/espresso-nutella/main-v1.webp` |
| Cold Brew | `cold-brew-main-v1.webp` | `products/specialty/cold-brew/main-v1.webp` |
| V60 | `v60-main-v1.webp` | `products/specialty/v60/main-v1.webp` |
| Franch Press | `franch-press-main-v1.webp` | `products/specialty/franch-press/main-v1.webp` |
| Matcha coconut latte | `matcha-coconut-latte-main-v1.webp` | `products/matcha/matcha-coconut-latte/main-v1.webp` |
| American cheese cake | `american-cheese-cake-main-v1.webp` | `products/desserts/american-cheese-cake/main-v1.webp` |
| Tiramisu | `tiramisu-main-v1.webp` | `products/desserts/tiramisu/main-v1.webp` |
| Dubai cake | `dubai-cake-main-v1.webp` | `products/desserts/dubai-cake/main-v1.webp` |
| Iced pistachio latte | `iced-pistachio-latte-main-v1.webp` | `products/cold-coffee/iced-pistachio-latte/main-v1.webp` |

## Control Tower Workflow

```text
create/verify bucket
upload real .webp asset
attach storagePath/publicUrl to matching ProductMediaDraft
human approve draft
publish draft
ProductImage created
mark primary
verify website/mobile rendering
```

## Blocker Removal Criteria

- `storage.buckets` includes `product-images`.
- 12 real assets exist at required paths.
- 12 matching drafts have `storagePath` or `publicUrl`.
- 12 drafts are approved and published.
- 12 P0 `ProductImage` records exist.
- Website/mobile render the real images.

