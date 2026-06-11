# SALORA Supabase Schema Alignment

Date: 2026-06-04  
Scope: Prisma schema, local migrations, live Supabase `information_schema` via `DIRECT_URL`.

## Executive Status

**PARTIAL**

Prisma schema and local migrations are ahead of the deployed Supabase schema.

## Required Table Alignment

| Domain Object | Prisma Model/Table | Supabase Status | Drift Status | Evidence |
|---|---|---:|---|---|
| Product | `CatalogProduct` / `catalog_products` | PRESENT | PRESENT | live `information_schema`; indexes include category/status/slug |
| Category | `ProductCategory` / `product_categories` | PRESENT | PRESENT | live `information_schema`; slug unique index present |
| ProductImage | `ProductImage` / `product_images` | PRESENT | PRESENT | live `information_schema`; product/sort and deleted indexes present |
| Promotion | `Promotion` / `promotions` | PRESENT | PRESENT | live `information_schema`; slug/status/deleted indexes present |
| Coupon | `Coupon` / `coupons` | PRESENT | PRESENT | live `information_schema`; code and active/date indexes present |
| FeatureFlag | `FeatureFlag` / `feature_flags` | PRESENT | PRESENT | live `information_schema`; key/environment unique index present |
| RuntimeConfig | `RuntimeConfiguration` / `runtime_configurations` | PRESENT | PRESENT | live `information_schema`; scope/key unique index present |
| ActivityLog | `ActivityLog` / `activity_logs` | PRESENT | PRESENT | live `information_schema`; actor/entity/created indexes present |
| AuditLog | `AuditLog` / `audit_logs` | PRESENT | PRESENT | live `information_schema`; actor/entity/action indexes present |
| Conversation | `Conversation` / `conversations` | PRESENT | PRESENT | live `information_schema`; channel/status/customer/order indexes present |
| ConversationMessage | `ConversationMessage` / `conversation_messages` | PRESENT | PRESENT | live `information_schema`; conversation/provider/status indexes present |
| WhatsappWebhookEvent | `WhatsappWebhookEvent` / `whatsapp_webhook_events` | MISSING | MISSING TABLE | absent from live `information_schema`; exists in local migration `202606040001_whatsapp_enterprise_events` |
| ProductMediaDraft | `ProductMediaDraft` / `product_media_drafts` | MISSING | MISSING TABLE | absent from live `information_schema`; exists in local migration `202606030003_control_tower_supremacy_launch` |

## Missing Tables

- `whatsapp_webhook_events`
- `product_media_drafts`

## Missing Indexes

Missing because their tables are missing:
- `whatsapp_webhook_events_provider_event_id_idx`
- `whatsapp_webhook_events_event_type_processing_status_idx`
- `whatsapp_webhook_events_correlation_id_idx`
- `whatsapp_webhook_events_received_at_idx`
- `whatsapp_webhook_events_deleted_at_idx`
- `product_media_drafts_product_id_status_idx`
- `product_media_drafts_status_created_at_idx`
- `product_media_drafts_archived_at_idx`

## Missing Constraints

Missing because their tables are missing:
- `product_media_drafts_product_id_fkey`
- primary key constraints for both missing tables
- not-null constraints defined by the pending migrations

## Missing Migrations

Live `_prisma_migrations` contains:
- `202605310001_auth_foundation`
- `202605310002_core_business_domains`
- `202605310003_runtime_persistence`
- `202605310004_revenue_platform`
- `202606010001_runtime_configuration`
- `202606030002_commercial_data_alignment_additive_only`

Local migrations missing from live Supabase:
- `202606030003_control_tower_supremacy_launch`
- `202606040001_whatsapp_enterprise_events`

## Deployment Readiness

**BLOCKED until migration review is approved and `DATABASE_URL` runtime is fixed.**

The direct schema is inspectable, but runtime services cannot be certified until the pooler connection works.
