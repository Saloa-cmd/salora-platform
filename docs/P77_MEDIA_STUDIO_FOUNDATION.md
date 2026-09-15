# SALORA P77 — AI Media Studio Foundation

## Scope

This phase adds a non-destructive Media Studio foundation inside Control Tower. It does **not** enable Production publishing, direct database writes, AI generation, or remote rendering.

## Goals

- Introduce a dedicated `media` Control Tower section.
- Provide a campaign-draft UI for creative goal, aspect ratio and direction.
- Keep human approval explicit.
- Establish a safe contract for later storyboard, render-job and review services.
- Reuse SALORA's current design tokens and permission-aware Control Tower routing.

## Architecture direction

```text
Control Tower
  -> Media Studio
     -> Campaign draft
     -> Brand profile
     -> Approved product/media sources
     -> Storyboard
     -> Render job queue (future)
     -> Review gate (future)
     -> Final render / publish (future, approval required)
```

## Reference projects reviewed

### erduo-broll-loop-engineering
Useful ideas: staged Director -> scene creation -> render -> independent reviewer, localized re-rendering, and explicit separation between draft and final output.

### code-to-video-remotion
Useful idea: typed content/config separated from reusable React scenes, which is a strong fit for product-driven campaign generation.

### OpenVideo
Useful idea: agent-friendly composition and preview model. We should borrow the workflow concepts, not copy implementation wholesale.

### Remotion
Candidate rendering engine because SALORA already uses React/TypeScript. Before commercial rollout, confirm the then-current Remotion license terms and deployment model.

## Phase 1 safety boundaries

- No modifications to Production data.
- No Production deployment or merge from this phase.
- No secrets in client components.
- No service-role credentials.
- No direct Supabase calls from the browser.
- No AI-generated content is automatically published.
- No render worker is executed from the Vercel request lifecycle.

## Proposed next phase

P77-B should introduce server-owned contracts for:

1. `MediaCampaignDraft`
2. `MediaAssetReference`
3. `StoryboardScene`
4. `RenderJob`
5. `CreativeReview`
6. audit events and approval state transitions

Suggested lifecycle:

`DRAFT -> STORYBOARDED -> READY_TO_RENDER -> RENDERING -> REVIEW -> APPROVED -> FINAL_RENDERED`

Publishing remains a separate explicit action.
