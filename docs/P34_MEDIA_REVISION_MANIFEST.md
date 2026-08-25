# P34 Media Revision — Healthy & Kids generated candidates

Status: **STAGED / NOT PRODUCTION PRIMARY**

P34 keeps the current certified Supabase ProductImage records as the active rollback-safe source. The generated Healthy/Kids media set is treated as a reviewed revision candidate and must not replace an existing Production primary until its durable asset URL is available and verified.

## Product mapping

| Product slug | Generated subject | Production action |
| --- | --- | --- |
| `protein-bar` | Artisan chocolate protein bar | Candidate only |
| `collagen-drink` | Premium collagen wellness drink | Candidate only |
| `healthy-pistachio-milkshake` | Pistachio milkshake | Candidate only |
| `healthy-chocolate-milkshake` | Chocolate milkshake | Candidate only |
| `keto-milkshake` | Almond/chocolate keto-style milkshake | Candidate only |
| `green-detox-stevia` | Cucumber/lime/mint detox drink | Candidate only |
| `babyccino` | Child-friendly cocoa babyccino | Candidate only |
| `strawberry-vanilla-milk` | Strawberry vanilla milk drink | Candidate only |
| `nesquik-chocolate-milk` | Chocolate milk | Candidate only |
| `nutella-milk` | Chocolate-hazelnut milkshake | Candidate only |

## Promotion gate

A generated candidate may become Primary only when all of the following are true:

1. The asset is stored at a durable public URL.
2. HTTP content type is an image format accepted by the web app.
3. Image dimensions and file size pass media QA.
4. The asset maps to exactly one SALORA product slug.
5. The previous ProductImage remains available for rollback.
6. Product status, price, category, options and orderability remain valid after the media switch.
7. A Control Tower operator explicitly promotes the new ProductImage to Primary.

No Production image is deleted by P34.
