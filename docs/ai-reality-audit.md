# SALORA AI Reality Audit

Date: 2026-06-04  
Scope: `packages/backend/src/ai`, `apps/web/app/api/control-tower/ai-studio`, AI-related Control Tower flows, live DB evidence.

## Executive Finding

OpenAI / AI state is **PARTIAL**.

Evidence:
- AI gateway code exists at `packages/backend/src/ai/gateway`.
- Provider abstraction includes OpenAI-compatible paths.
- Local environment contains AI provider configuration keys, but this audit did not expose or print secret values.
- Live Supabase has `ai_recommendation_records` and `ai_evaluation_records`.
- Both AI tables have live count 0.
- Image draft workflows reference `product_media_drafts`, which is missing from live Supabase.
- No live OpenAI completion or image generation result was verified in this audit.

## Capability Reality

| Capability | Status | Evidence |
|---|---|---|
| OpenAI key configured | UNKNOWN | Key name exists locally, but no secret value is printed and no live OpenAI call was performed |
| AI Gateway active in code | PARTIAL | `packages/backend/src/ai/gateway/gateway.ts` and provider modules exist |
| AI drafts saved | UNKNOWN | Routes create `ai_recommendation_records`, but live count is 0 |
| AI product descriptions | PARTIAL | `runAiDraft()` and Control Tower AI product tools exist; live result not verified |
| AI image prompts | PARTIAL | Media and AI Studio routes generate image prompt drafts in code |
| AI image generation | BLOCKED | No verified real image generation path; media draft persistence depends on missing `product_media_drafts` |
| AI evaluation | PARTIAL | `ai_evaluation_records` table exists; live count is 0 |
| AI observability | PARTIAL | Activity/Audit log tables exist but live counts are 0 |

## Connected Areas

Connected in code:
- Control Tower AI Studio.
- Simple Launch AI product tools.
- AI gateway abstraction.
- AI recommendation persistence model.

Partially connected:
- Product context can be loaded from catalog routes.
- AI draft records can be saved if runtime DB connectivity works.

Blocked:
- Image draft persistence in production DB.
- Any claim of live OpenAI operation.

## AI Conclusion

The AI architecture exists, but production AI readiness is not proven. Text generation is implemented in code, while image-related workflows and live persistence cannot be certified from current evidence.
