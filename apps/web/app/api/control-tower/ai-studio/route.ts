import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";
import { aiStudioSchema, runProductAiDraft } from "@/lib/server/supremacyControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, aiStudioSchema);
    if (!parsed.success) return responseError("Invalid AI Studio payload.", id);
    const input = parsed.data;
    const { product, draft } = await runProductAiDraft(input, { userId: actor.sub, roles: actor.roles });
    if (input.operation === "image_draft") {
      const mediaDraft = await repo.mediaDrafts.create({
        productId: product.id,
        source: "ai_image",
        prompt: draft.answer,
        metadata: { provider: draft.provider, correlationId: draft.correlationId, draftOnly: true, requestId: id }
      });
      await writeActivity({ actorId: actor.sub, action: "aiStudio.imageDraft", entityType: "ProductMediaDraft", entityId: mediaDraft.id, requestId: id, metadata: { productSlug: product.slug } }, repo);
      await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "ProductMediaDraft", entityId: mediaDraft.id, after: mediaDraft, requestId: id, reason: "AI image draft created; not published" }, repo);
      return responseJson({ draft, mediaDraft }, id, 201);
    }
    const record = await repo.aiRecords.create({
      productId: product.id,
      correlationId: draft.correlationId,
      provider: draft.provider.provider,
      model: draft.provider.model,
      intent: `ai_studio_${input.operation}`,
      context: { input, draftOnly: true, requestId: id },
      reason: draft.answer
    });
    await writeActivity({ actorId: actor.sub, action: `aiStudio.${input.operation}`, entityType: "AiRecommendationRecord", entityId: record.id, requestId: id, metadata: { productSlug: product.slug } }, repo);
    await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "AiRecommendationRecord", entityId: record.id, after: record, requestId: id, reason: "AI Studio draft generated; not published" }, repo);
    return responseJson({ draft, record }, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
