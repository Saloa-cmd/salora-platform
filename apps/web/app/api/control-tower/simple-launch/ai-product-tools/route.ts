import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { aiProductToolSchema, handleError, parseBody, requireControlPermission, requestId, runAiDraft, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, aiProductToolSchema);
    if (!parsed.success) return responseError("Invalid AI product tool payload.", id);
    const input = parsed.data;
    const draft = await runAiDraft(input);
    const product = input.productSlug ? await repo.products.findUnique({ slug: input.productSlug }) : null;
    const record = await repo.aiRecords.create({
      productId: product?.id,
      correlationId: draft.correlationId,
      provider: draft.provider.provider,
      model: draft.provider.model,
      intent: `product_${input.operation}`,
      context: { input, draftOnly: true, requestId: id },
      reason: draft.answer
    });
    await writeActivity({ actorId: actor.sub, action: `aiProduct.${input.operation}`, entityType: "AiRecommendationRecord", entityId: record.id, requestId: id, metadata: { productSlug: input.productSlug } }, repo);
    await writeAudit({ actorId: actor.sub, action: "CREATE", entityType: "AiRecommendationRecord", entityId: record.id, after: record, requestId: id, reason: "AI product draft generated; not auto-published" }, repo);
    return responseJson({ draft, record }, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
