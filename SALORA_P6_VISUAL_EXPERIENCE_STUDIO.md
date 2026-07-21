# SALORA P6 — Visual Experience Studio

## Outcome

The Control Tower now contains an Arabic-first, no-code Experience Studio for governing the customer-facing menu, brand theme, banners, public website hero, and mobile-app presentation settings.

## Live controls

- Menu layout: grid/list/editorial, 2–4 columns, image ratio, search, categories, images, and descriptions.
- Theme: primary, background, surface, text, and muted colors; radius; typography family.
- Banners: bilingual content, secure HTTPS media, placement, activation, order, and destination.
- Website: bilingual hero content, logo URL, and bilingual announcement bar.
- Mobile: hero/announcement/theme payload plus ordering, recommendation, density, and navigation settings through `/api/experience`.
- Governance: draft save, explicit publish, version counters, audit history, and restore-and-publish.

## Storage and security

The implementation reuses the existing `runtime_configurations` table instead of introducing a parallel CMS table:

- `HOMEPAGE / salora_experience_draft`
- `HOMEPAGE / salora_experience_published`

All write operations require `system:write`, pass through the existing authenticated Control Tower API, increment versions, and write activity/audit records. Public clients receive only the validated published configuration. Secret-like settings cannot be managed through this studio. Media URLs must use HTTPS and links must be internal paths or HTTPS.

## Operator flow

1. Sign in to Control Tower.
2. Open **Content / المحتوى**.
3. Edit using the five studio tabs and verify the live preview.
4. Select **Save draft / حفظ مسودة** to preserve work without affecting customers.
5. Select **Publish now / نشر الآن** to update the menu, website, and mobile configuration API.
6. Use **History / السجل والرجوع** to restore a previous published revision.

## Deployment

No database migration is required because the schema-managed runtime configuration and audit tables already provide the required durable contracts. Deploy the web application normally. The first publish creates both configuration records atomically through existing Prisma/RLS infrastructure.

## Verification completed

- Web and mobile TypeScript checks.
- Full repository test suite.
- ESLint.
- Next.js production build, including `/api/control-tower/experience` and `/api/experience`.
