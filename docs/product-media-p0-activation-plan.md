# SALORA Product Media P0 Activation Plan

Date: 2026-06-05  
Phase: Soft Launch Operational Activation / Phase C

## Final Status

**MEDIA_PARTIAL**

Reason: `ProductMediaDraft` workflow is database-ready, but there are no real product images yet. `ProductImage` count is `0 / 96`. No fake images or fake URLs were created.

## Workflow Verification

| Step | Result | Evidence |
|---|---|---|
| Create ProductMediaDraft | PASS_ROLLBACK | draft created in transaction |
| Approve ProductMediaDraft | PASS_ROLLBACK | status set to `APPROVED` in transaction |
| Publish draft | SKIPPED | no real image URL/path exists |
| Create ProductImage | SKIPPED | no real asset exists |
| Set primary image | SKIPPED | no real ProductImage exists |

## P0 Product Image Plan

| Priority | Product | Category | Filename | Supabase Storage Path | Style Direction | AI Prompt Draft | Required Human Action |
|---:|---|---|---|---|---|---|---|
| 1 | Matcha coconut latte | Matcha section | `matcha-coconut-latte-p0.jpg` | `product-images/p0/matcha-coconut-latte/matcha-coconut-latte-p0.jpg` | bright matcha green, chilled premium latte, coconut accent, clean SALORA surface | Premium commercial cafe photo of matcha coconut latte, vibrant green matcha, coconut milk texture, condensation, soft daylight, minimalist luxury cafe styling, no text, no logo | Photograph or approve real generated/shot asset, upload to Supabase Storage |
| 2 | Espresso cream | Hot coffee | `espresso-cream-p0.jpg` | `product-images/p0/espresso-cream/espresso-cream-p0.jpg` | close espresso crema, warm contrast, premium ceramic | Macro commercial shot of espresso cream with rich crema, warm cafe lighting, premium cup, shallow depth of field, no text | Upload real image and approve |
| 3 | Cold Brew | Specialty coffee | `cold-brew-p0.jpg` | `product-images/p0/cold-brew/cold-brew-p0.jpg` | clear glass, ice, amber coffee, condensation | Premium cold brew in glass with ice, amber tones, condensation, modern cafe counter, daylight, no text | Upload real image and approve |
| 4 | Franch Press | Specialty coffee | `franch-press-p0.jpg` | `product-images/p0/franch-press/franch-press-p0.jpg` | brewing ritual, press pot, textured coffee bar | French press coffee service, premium glass press, dark coffee, warm cafe setting, hands optional, no text | Confirm spelling/name, upload real image |
| 5 | V60 | Specialty coffee | `v60-p0.jpg` | `product-images/p0/v60/v60-p0.jpg` | pour-over action, clean cone, slow coffee craft | V60 pour-over coffee preparation, clean dripper, steam, precise pouring, specialty cafe aesthetic, no text | Upload real image and approve |
| 6 | Americano | Hot coffee | `americano-p0.jpg` | `product-images/p0/americano/americano-p0.jpg` | black coffee clarity, elegant cup, minimal | Premium Americano in ceramic cup, dark surface, subtle crema, minimalist luxury cafe table, no text | Upload real image |
| 7 | Cappuccino | Hot coffee | `cappuccino-p0.jpg` | `product-images/p0/cappuccino/cappuccino-p0.jpg` | latte art, foam texture, warm ceramic | Cappuccino with refined latte art, velvety foam, warm cup, soft natural light, premium cafe styling, no text | Upload real image |
| 8 | Carmel latte | Hot coffee | `carmel-latte-p0.jpg` | `product-images/p0/carmel-latte/carmel-latte-p0.jpg` | caramel drizzle, milk texture, warm palette | Caramel latte with glossy caramel accent, creamy foam, premium cafe cup, warm lighting, no text | Confirm spelling, upload real image |
| 9 | Carmel macchiato | Hot coffee | `carmel-macchiato-p0.jpg` | `product-images/p0/carmel-macchiato/carmel-macchiato-p0.jpg` | layered caramel coffee, glass/cup | Caramel macchiato with layered coffee and milk, caramel drizzle, elegant cafe setting, no text | Confirm spelling, upload real image |
| 10 | Cortedo | Hot coffee | `cortedo-p0.jpg` | `product-images/p0/cortedo/cortedo-p0.jpg` | small coffee, milk balance, ceramic | Cortado style small coffee with balanced milk, premium ceramic cup, soft cafe light, no text | Confirm product spelling/name before asset |
| 11 | Espresso | Hot coffee | `espresso-p0.jpg` | `product-images/p0/espresso/espresso-p0.jpg` | single espresso hero, crema focus | Single espresso shot with rich crema, premium cup, dramatic but natural cafe lighting, no text | Upload real image |
| 12 | Espresso Nutella | Hot coffee | `espresso-nutella-p0.jpg` | `product-images/p0/espresso-nutella/espresso-nutella-p0.jpg` | dessert-like espresso, chocolate accent | Espresso Nutella drink with chocolate-hazelnut accent, rich crema, premium dessert coffee styling, no text | Upload real image |

## Required Next Human Action

Capture or approve real assets, upload them to Supabase Storage, then publish through the existing `ProductMediaDraft -> ProductImage -> primary image` workflow.
