# Commercial Data Prisma Alignment Review

Date: 2026-06-03

## Scope

Reviewed `schema.prisma` against the curated additive-only migration for the approved commercial launch models only.

## Alignment Status

Status: ALIGNED

The Prisma schema contains the same approved model set represented by the curated migration:

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

The required enums are also aligned:

- `DiscountType`
- `PromotionStatus`
- `ReviewStatus`
- `AuditAction`

## Safe Schema Adjustments Made

Only approved new commercial models were adjusted:

- New table `id` fields now use `@default(dbgenerated("gen_random_uuid()"))`.
- New commercial `updatedAt` fields now include `@default(now()) @updatedAt`.

Reason: the prior generated migration exposed drift caused by database defaults in SQL history versus Prisma-side defaults. These adjustments keep the curated new tables aligned with database defaults without changing any existing historical table.

## Historical Drift Boundary

Existing historical models still contain older Prisma/default mismatch risk, but this migration does not attempt to fix it. That work remains intentionally out of scope and should be handled only by a separate database-foundation drift remediation review.

## Conclusion

The Prisma schema and curated migration represent the same approved new commercial launch objects without rewriting old schema history.
