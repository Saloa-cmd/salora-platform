# SALORA Opening Offers Program

Date: 2026-06-05  
Rule: Planning only. No Promotion or Coupon activation was performed.

## Offer 1: Buy 2 Get 1

| Field | Structure |
|---|---|
| Target | Coffee repeat purchase during opening week |
| Eligible products | Spanish latte, Pistachio latte, Cold Brew, V60 |
| Coupon structure | `OPENING-B2G1-P0`, single campaign code, limited quantity |
| Promotion structure | Promotion status starts as `DRAFT`; rules define 3 qualifying drinks with lowest-priced item free |
| Runtime activation plan | Create draft coupon/promotion in Control Tower, review margin, activate for staging, then production window |

## Offer 2: Dessert + Coffee Combo

| Field | Structure |
|---|---|
| Target | Raise average order value |
| Eligible products | Tiramisu, American cheese cake, Dubai cake + Spanish latte / Espresso cream / Cold Brew |
| Coupon structure | `DESSERT-COFFEE-COMBO`, fixed combo discount |
| Promotion structure | DRAFT combo promotion mapped to dessert and coffee product pairs |
| Runtime activation plan | Validate product availability and photos first; activate after P0 images are published |

## Offer 3: Matcha Launch Offer

| Field | Structure |
|---|---|
| Target | Launch matcha category with clear visual hero |
| Eligible products | Matcha coconut latte |
| Coupon structure | `MATCHA-LAUNCH`, limited introductory discount |
| Promotion structure | DRAFT category/product promotion for matcha |
| Runtime activation plan | Activate only after matcha image exists and website/mobile show it correctly |

## Offer 4: Loyalty Welcome Offer

| Field | Structure |
|---|---|
| Target | Encourage return visits from first 10 users |
| Eligible products | All P0 products except water/low-margin items |
| Coupon structure | `WELCOME-SALORA`, first-order or next-visit code |
| Promotion structure | DRAFT loyalty welcome promotion with usage limits |
| Runtime activation plan | Keep draft until customer identity/loyalty capture flow is verified |

## Readiness

| Item | Status |
|---|---|
| Offer strategy | READY |
| Coupon/promotion database activation | NOT_STARTED |
| Product image dependency | BLOCKING_VISUAL_LAUNCH |
| Human approval required | YES |
