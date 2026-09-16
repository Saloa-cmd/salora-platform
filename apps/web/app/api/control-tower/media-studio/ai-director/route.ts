import { type NextRequest } from "next/server";
import { createControlTowerRepository, routeAiRequest } from "@salora/backend";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { mediaAiDirectorSchema } from "@/lib/media-studio/contracts";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const parsed = await parseBody(request, mediaAiDirectorSchema);
    if (!parsed.success) return responseError("Invalid AI creative direction request.", id, 400);

    const input = parsed.data;
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const product = await repo.products.findUnique({ slug: input.productSlug });
    if (!product || product.brandKey !== "SALORA") return responseError("SALORA product not found.", id, 404);
    const images = await repo.productImages.findMany({ where: { productId: product.id, deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] });
    if (!images.length) return responseError("Approved product media is required.", id, 409);

    const result = await routeAiRequest({
      message: [
        "You are SALORA AI Creative Director for a premium cafe media studio.",
        "Create a concise production-ready storyboard using only the supplied real product facts.",
        "Never invent ingredients, prices, offers, availability, awards, or claims.",
        "Return plain text with exactly 3 scene lines in this format: Title | seconds | visual direction.",
        "Keep total duration between 12 and 20 seconds. Use premium cinematic pacing, restrained matte-black and warm-gold brand cues, and bilingual-safe framing.",
        `Language: ${input.locale}`,
        `Product: ${product.name}`,
        `Arabic name: ${product.nameAr ?? ""}`,
        `English name: ${product.nameEn ?? ""}`,
        `Price: ${String(product.basePrice)}`,
        `Goal: ${input.goal}`,
        `Output: ${input.format}`,
        `Approved media count: ${images.length}`,
        `Operator direction: ${input.creativeDirection}`
      ].join("\n"),
      intent: "explain_product",
      channel: "web",
      locale: input.locale,
      context: { channel: "web", locale: input.locale, products: [{ slug: product.slug, name: product.name, nameAr: product.nameAr, nameEn: product.nameEn, basePrice: product.basePrice }] }
    });

    await writeActivity({ actorId: actor.sub, action: "mediaStudio.aiDirector", entityType: "MediaCampaign", entityId: product.id, requestId: id, metadata: { provider: result.provider.provider, model: result.provider.model, correlationId: result.correlationId, safetyBlocked: result.safety.blocked, goal: input.goal, format: input.format } });
    return responseJson({ suggestion: result.answer, provider: result.provider, evaluation: result.evaluation, safety: result.safety, correlationId: result.correlationId }, id);
  } catch (error) {
    return handleError(error, id);
  }
}
