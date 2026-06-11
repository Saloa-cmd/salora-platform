# SALORA P0 Product Image Production Guide

Date: 2026-06-05  
Rule: No fake images, no placeholder URLs, no auto-publish.

## Pipeline

Use the existing workflow only:

```text
Real asset captured/uploaded
-> ProductMediaDraft updated with storagePath/publicUrl
-> Human approval
-> Publish draft
-> ProductImage created
-> Primary image set
-> Website/Mobile verification
```

Current status:
- `ProductMediaDraft` prompt drafts created: 12.
- `ProductImage` records created: 0.
- All P0 media drafts remain draft-only and have no fake `storagePath` or `publicUrl`.

## Production Briefs

| Product | Image Brief | Photography Direction | Camera Angle | Lighting Setup | Styling Notes | Filename | Storage Path |
|---|---|---|---|---|---|---|---|
| Spanish latte | Signature creamy latte hero | Premium ceramic cup, visible milk texture | 45-degree tabletop hero | Soft daylight from side, warm fill | Marble or warm wood, minimal gold accent | `spanish-latte-main-v1.webp` | `products/coffee/spanish-latte/main-v1.webp` |
| Pistachio latte | Premium pistachio latte | Frothy top, crushed pistachio garnish | Slight overhead 35-45 degrees | Warm cafe light, controlled highlights | Gold accent, neutral background | `pistachio-latte-main-v1.webp` | `products/coffee/pistachio-latte/main-v1.webp` |
| Espresso cream | Layered espresso and cream | Clear glass or small cup showing contrast | Macro close-up | Focused softbox, dark bounce | Black marble, no clutter | `espresso-cream-main-v1.webp` | `products/coffee/espresso-cream/main-v1.webp` |
| Espresso Nutella | Dessert espresso hero | Nutella swirl/detail with espresso crema | Close-up 45 degrees | Warm directional light | Dark velvet or rich brown surface | `espresso-nutella-main-v1.webp` | `products/coffee/espresso-nutella/main-v1.webp` |
| Cold Brew | Chilled specialty coffee | Tall glass, ice, condensation | Eye-level glass hero | Crisp daylight, cool highlights | Modern black table, clean background | `cold-brew-main-v1.webp` | `products/specialty/cold-brew/main-v1.webp` |
| V60 | Craft pour-over ritual | Dripper, carafe, steam or pour action | 45-degree action shot | Morning side light | Clean brewing tools, specialty cue | `v60-main-v1.webp` | `products/specialty/v60/main-v1.webp` |
| Franch Press | French press service | Press pot with brewed coffee | 30-degree tabletop | Warm ambient cafe light | Wood surface, cup nearby | `franch-press-main-v1.webp` | `products/specialty/franch-press/main-v1.webp` |
| Matcha coconut latte | Vibrant matcha latte | Green matcha, coconut milk texture | Eye-level or slight overhead | Bright soft daylight | Coconut flakes optional, light wood | `matcha-coconut-latte-main-v1.webp` | `products/matcha/matcha-coconut-latte/main-v1.webp` |
| American cheese cake | Classic premium cheesecake | Slice on fine plate | 45-degree dessert shot | Soft side light | Berry garnish acceptable if real plating | `american-cheese-cake-main-v1.webp` | `products/desserts/american-cheese-cake/main-v1.webp` |
| Tiramisu | Layered tiramisu hero | Cocoa dusting, visible layers | Close-up dessert angle | Warm cafe light | Polished wood or cream plate | `tiramisu-main-v1.webp` | `products/desserts/tiramisu/main-v1.webp` |
| Dubai cake | Local luxury dessert | Moist slice, nuts/spices visible | 45-degree hero | Warm highlight, subtle gold | Gold-rim plate, premium tabletop | `dubai-cake-main-v1.webp` | `products/desserts/dubai-cake/main-v1.webp` |
| Iced pistachio latte | Cold pistachio latte | Iced glass, garnish, condensation | Eye-level glass hero | Bright soft light | Marble table, modern cafe look | `iced-pistachio-latte-main-v1.webp` | `products/cold-coffee/iced-pistachio-latte/main-v1.webp` |

## AI Image Prompt Drafts

These prompts are stored in `ProductMediaDraft` as draft-only records.

| Product | AI Image Prompt |
|---|---|
| Spanish latte | A luxurious cup of Spanish latte in a fine porcelain cup on a marble table, soft natural light highlighting the creamy texture, elegant cafe setting |
| Pistachio latte | Close-up of a pistachio latte with frothy top and crushed pistachio garnish, set on a dark wooden table with elegant gold accents |
| Espresso cream | Elegant glass cup of espresso cream showing distinct layers of dark espresso and white cream, on a minimalist black marble surface |
| Espresso Nutella | Luxurious espresso Nutella served in a clear glass cup with a swirl of Nutella on top, set against a dark velvet background |
| Cold Brew | Tall glass of dark cold brew coffee with ice cubes, condensation on glass, set on a sleek black table with modern cafe ambiance |
| V60 | Elegant V60 pour-over setup with steaming coffee dripping into a glass carafe, wooden table, soft morning light |
| Franch Press | Classic French Press pot with freshly brewed coffee, wooden table setting, warm ambient lighting |
| Matcha coconut latte | Vibrant green matcha coconut latte in a clear glass cup, topped with coconut flakes, set on a light wooden table with tropical decor |
| American cheese cake | Slice of American cheese cake on fine china, garnished with fresh berries, elegant cafe background |
| Tiramisu | Elegant glass of tiramisu with cocoa dusting, served on a polished wooden table in a luxury cafe setting |
| Dubai cake | Slice of Dubai cake with visible nuts and spices, served on a gold-rimmed plate with elegant cafe decor |
| Iced pistachio latte | Glass of iced pistachio latte with crushed pistachio garnish, condensation on glass, set on a marble table in a modern cafe |
