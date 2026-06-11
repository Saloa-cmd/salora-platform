# Control Tower Human Review Checklist

Date: 2026-06-03

## Status

Status: READY_FOR_HUMAN_REVIEW

Use this checklist inside the existing Control Tower. Do not delete products, create fake images, or change prices unless approved by the business owner.

## Product Review

| Review Item | Required Human Action | Pass Criteria |
| --- | --- | --- |
| Product name | Check spelling, capitalization, and menu wording. | English display name is approved. |
| Arabic product name | Add or approve Arabic name manually where needed. | No Arabic names are invented by AI. |
| Category | Confirm each product appears in the correct menu category. | Category matches the physical menu. |
| Price | Confirm OMR price against approved menu. | No price is changed without approval. |
| Status | Confirm ACTIVE products are intended for soft launch. | Staging-only products are archived only after approval. |
| Description | Confirm blank descriptions are acceptable or provide real copy. | No fake descriptions are added. |
| Image readiness | Confirm real photography priority. | Product remains image-missing until a real asset exists. |

## Extra Product Review

| Product | Current Status | Decision Needed |
| --- | --- | --- |
| `staging-honey-cake` | ACTIVE | Keep for launch or archive |
| `staging-matcha-latte` | ACTIVE | Keep for launch or archive |

## Commercial Review

| Area | Human Check |
| --- | --- |
| Promotions | Confirm 2 active promotions are suitable for soft launch. |
| Coupons | Confirm 2 active coupons are non-extreme and time-appropriate. |
| Feature flags | Confirm 6 staging flags reflect launch intent. |
| Online ordering | Confirm enabled/disabled state before inviting users. |
| Payments | Confirm Stripe test/live expectation with launch owner. |
| AI concierge | Confirm AI draft-only behavior remains clear to operators. |

## Sign-Off

| Role | Required Decision |
| --- | --- |
| Product Operations | Product names, categories, and image priorities approved. |
| Finance/Owner | Prices, coupons, and promotions approved. |
| Brand/Content | Photography style and Arabic naming approved. |
| Control Tower QA | Product visibility, feature flags, and image gaps verified. |
