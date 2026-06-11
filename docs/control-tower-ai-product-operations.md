# Control Tower AI Product Operations

Date: 2026-06-03

## Status

Status: CONNECTED

The existing Control Tower now exposes admin-only AI product draft actions through `/api/control-tower/simple-launch/ai-product-tools`.

## Supported Actions

| Action | Status | Storage | Publish behavior |
| --- | --- | --- | --- |
| Generate product description draft | CONNECTED | `ai_recommendation_records` | Never auto-published |
| Generate short menu copy draft | CONNECTED | `ai_recommendation_records` | Never auto-published |
| Suggest pairing | CONNECTED | `ai_recommendation_records` | Never auto-published |
| Suggest category | CONNECTED | `ai_recommendation_records` | Never auto-published |
| Suggest upsell | CONNECTED | `ai_recommendation_records` | Never auto-published |
| Generate image prompt only | CONNECTED | `ai_recommendation_records` | No image generation |

## Safety Rules

- Uses the existing AI Gateway through `routeAiRequest`.
- Requires existing Control Tower permission.
- Uses Zod validation.
- Writes ActivityLog and AuditLog.
- Stores generated output as reviewable AI recommendation records.
- Does not mutate product descriptions automatically.
- Does not create image URLs.
- Does not call an image generation provider.

## Control Tower Usage

Operators can select a product from the Simple Launch operations section, choose an AI draft action, and review the returned draft. Human review remains mandatory before any catalog field is changed.
