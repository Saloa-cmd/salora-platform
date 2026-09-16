import { type NextRequest } from "next/server";
import { createControlTowerRepository, getPrismaClient } from "@salora/backend";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { mediaCampaignDraftSchema, type RenderJob } from "@/lib/media-studio/contracts";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JobRow = { id: string; state: RenderJob["state"]; created_at: Date };

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:read");
    const parsed = await parseBody(request, mediaCampaignDraftSchema);
    if (!parsed.success) return responseError("Invalid media campaign draft.", id, 400);

    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const product = await repo.products.findUnique({ slug: parsed.data.productSlug });
    if (!product || product.brandKey !== "SALORA") return responseError("SALORA product not found.", id, 404);
    const images = await repo.productImages.findMany({ where: { productId: product.id, deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] });
    if (!images.length) return responseError("Approved product media is required before render planning.", id, 409);

    const durationSeconds = parsed.data.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
    if (durationSeconds > 60) return responseError("Render duration must not exceed 60 seconds.", id, 400);

    const prisma = getPrismaClient();
    const inputProps = { productSlug: product.slug, productName: product.name, productNameAr: product.nameAr, productNameEn: product.nameEn, price: String(product.basePrice), goal: parsed.data.goal, format: parsed.data.format, creativeDirection: parsed.data.creativeDirection, assets: images.map((image) => ({ id: image.id, publicUrl: image.publicUrl, altText: image.altText, isPrimary: image.isPrimary })) };
    const rows = await prisma.$queryRawUnsafe<JobRow[]>(
      `INSERT INTO media_render_jobs (product_id, created_by, state, composition_id, format, storyboard, input_props, duration_seconds) VALUES ($1::uuid,$2::uuid,'DRAFT','SaloraProductPreview',$3,$4::jsonb,$5::jsonb,$6) RETURNING id,state,created_at`,
      product.id, actor.sub, parsed.data.format, JSON.stringify(parsed.data.scenes), JSON.stringify(inputProps), durationSeconds
    );
    const row = rows[0];
    if (!row) return responseError("Render job could not be persisted.", id, 500);
    await prisma.$executeRawUnsafe(`INSERT INTO media_audit_events (render_job_id,actor_id,action,to_state,metadata) VALUES ($1::uuid,$2::uuid,'CREATE_RENDER_JOB','DRAFT',$3::jsonb)`, row.id, actor.sub, JSON.stringify({ requestId: id, productSlug: product.slug, format: parsed.data.format, sceneCount: parsed.data.scenes.length }));
    await writeActivity({ actorId: actor.sub, action: "mediaStudio.renderJob.create", entityType: "MediaRenderJob", entityId: row.id, requestId: id, metadata: { productSlug: product.slug, durationSeconds, sceneCount: parsed.data.scenes.length } });

    const job: RenderJob = { id: row.id, state: row.state, productSlug: product.slug, format: parsed.data.format, sceneCount: parsed.data.scenes.length, durationSeconds, compositionId: "SaloraProductPreview", createdAt: row.created_at.toISOString() };
    return responseJson({ job, product: { id: product.id, slug: product.slug, name: product.name, nameAr: product.nameAr, nameEn: product.nameEn, images } }, id, 201);
  } catch (error) {
    return handleError(error, id);
  }
}
