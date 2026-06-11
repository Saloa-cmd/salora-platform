# Commercial Data Alignment Review

Date: 2026-06-02

## Decision

The previous SQL-first commercial database migration is rejected and must not be applied.

Commercial Data Alignment is now Prisma-first and aligned with Simple Launch. The database and Prisma schema must stay synchronized before any Supabase deployment.

## Scope Kept

- Product Images
- Coupons
- Promotions
- Reviews
- Feature Flags
- Activity Logs
- Audit Logs
- Analytics Views as SQL plan

## Scope Excluded

- Branches
- Cafe Tables
- Reservations
- Multi-location support
- Advanced RLS policies

## Prisma Schema Status

`prisma/schema.prisma` has been updated with launch-aligned models and enums only.

Validation command executed:

```powershell
.\node_modules\.bin\prisma.CMD validate --schema ..\..\prisma\schema.prisma
```

Result: PASS

No migration was generated. No Supabase deployment was run.

## Added Prisma Enums

- `DiscountType`
- `PromotionStatus`
- `ReviewStatus`
- `AuditAction`

## Added Prisma Models

- `ProductImage`
- `Coupon`
- `CouponRedemption`
- `Promotion`
- `PromotionProduct`
- `ProductReview`
- `AiRecommendationRecord`
- `FeatureFlag`
- `ActivityLog`
- `AuditLog`

## Updated Existing Models

- `CatalogProduct`: relations to images, promotions, reviews, AI recommendations.
- `CustomerProfile`: relations to coupon redemptions, reviews, AI recommendations.
- `CafeOrder`: `discountTotal`, coupon redemption relation, reviews relation.

## Review Result

Commercial Data Alignment is ready for migration review, not deployment.

Next step is to generate a reviewed SQL migration from Prisma using a non-deploy command, inspect it, then apply only after approval.
