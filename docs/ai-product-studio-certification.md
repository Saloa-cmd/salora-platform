# AI Product Studio Certification

Date: 2026-06-03

## Status

Status: IMPLEMENTED_DRAFT_ONLY

AI Studio now operates from the existing Control Tower through `/api/control-tower/ai-studio`.

## Supported Operations

| Operation | Storage | Publish Behavior |
| --- | --- | --- |
| Product description | `AiRecommendationRecord` | Never auto-published |
| Short description | `AiRecommendationRecord` | Never auto-published |
| Pairing suggestion | `AiRecommendationRecord` | Never auto-published |
| Upsell suggestion | `AiRecommendationRecord` | Never auto-published |
| Category suggestion | `AiRecommendationRecord` | Never auto-published |
| Image prompt | `AiRecommendationRecord` | Never auto-published |
| Image draft | `ProductMediaDraft` | Requires approval before publish |

## Safety Certification

- Uses the existing AI Gateway.
- Requires Control Tower RBAC.
- Stores output as reviewable draft data.
- Does not mutate product fields automatically.
- Does not create public ProductImage rows automatically.
- Writes ActivityLog and AuditLog for every draft creation.

## Decision

AI Operations are implementation-ready, but final launch score depends on OpenAI runtime validation during final gates.
