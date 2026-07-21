import { type NextRequest } from "next/server";
import { createControlTowerRepository, SYSTEM_AUTH_CONTEXT } from "@salora/backend";
import { responseJson } from "@/lib/server/domainHttp";
import { handleError, requestId } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const resourceType = request.nextUrl.searchParams.get("type")?.toUpperCase();
    const key = request.nextUrl.searchParams.get("key");
    const repo = await createControlTowerRepository(SYSTEM_AUTH_CONTEXT);
    const documents = await repo.cms.run<any[]>((db) => db.cmsDocument.findMany({
      where: { brandKey: "SALORA", OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: new Date() } }], ...(resourceType ? { resourceType } : {}), ...(key ? { key } : {}) },
      orderBy: [{ resourceType: "asc" }, { updatedAt: "desc" }],
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
      take: 250
    }));
    return responseJson(documents.map((document: any) => ({ id: document.id, type: document.resourceType, key: document.key, slug: document.slug, titleAr: document.titleAr, titleEn: document.titleEn, publishedAt: document.publishedAt, revision: document.revisions[0]?.version, payload: document.revisions[0]?.payload ?? {} })), id);
  } catch (error) {
    return handleError(error, id);
  }
}
