import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { mediaCampaignDraftSchema, type RenderJob } from "@/lib/media-studio/contracts";
import { handleError, parseBody, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const parsed = await parseBody(request, mediaCampaignDraftSchema);
    if (!parsed.success) return responseError("Invalid media campaign draft.", id, 400);

    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const product = await repo.products.findUnique({ slug: parsed.data.productSlug });
    if (!product || product.brandKey !== "SALORA") return responseError("SALORA product not found.", id, 404);
    const images = await repo.productImages.findMany({
      where: { productId: product.id, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
    });
    if (!images.length) return responseError("Approved product media is required before preview planning.", id, 409);

    const durationSeconds = parsed.data.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
    if (durationSeconds > 60) return responseError("Preview duration must not exceed 60 seconds.", id, 400);

    const job: RenderJob = {
      id: `preview-${id}`,
      state: "PREVIEW_PLANNED",
      productSlug: product.slug,
      format: parsed.data.format,
      sceneCount: parsed.data.scenes.length,
      durationSeconds,
      compositionId: "SaloraProductPreview",
      createdAt: new Date().toISOString()
    };

    // Phase P77-B deliberately creates an ephemeral server-owned plan only.
    // It does not persist, enqueue, publish, or mutate Production data.
    return responseJson({ job, product: { id: product.id, slug: product.slug, name: product.name, nameAr: product.nameAr, nameEn: product.nameEn, images } }, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
