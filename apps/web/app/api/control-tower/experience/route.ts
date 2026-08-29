import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { defaultExperiencePageV2, EXPERIENCE_PAGE_V2_DRAFT_KEY } from "@/lib/experience/default-page-v2";
import { adaptExperienceConfigurationV1 } from "@/lib/experience/compatibility";
import { experiencePageV2Schema, parseExperiencePageV2 } from "@/lib/experience/schema-v2";
import { getPublishedExperienceConfiguration } from "@/lib/server/experienceConfig";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mutationSchema = z.object({ action: z.literal("save"), page: experiencePageV2Schema, expectedVersion: z.number().int().nonnegative() }).strict();

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "content:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const [draft, publishedConfiguration] = await Promise.all([
      repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_PAGE_V2_DRAFT_KEY } }),
      getPublishedExperienceConfiguration()
    ]);
    const publishedPage = adaptExperienceConfigurationV1(publishedConfiguration, "published-experience-v1");
    return responseJson({ page: draft ? parseExperiencePageV2(draft.value) : defaultExperiencePageV2, publishedPage, draftVersion: draft?.version ?? 0, publicationAuthority: "NONE_PR3", legacyPublicationPath: "READ_ONLY_COMPARISON" }, id);
  } catch (error) { return handleError(error, id); }
}

export async function PATCH(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "content:write");
    const parsed = await parseBody(request, mutationSchema);
    if (!parsed.success) return responseError("Invalid typed experience draft.", id, 422);
    if (parsed.data.page.status !== "DRAFT") return responseError("PR3 accepts DRAFT experience revisions only.", id, 409);

    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const before = await repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_PAGE_V2_DRAFT_KEY } });
    const currentVersion = before?.version ?? 0;
    if (parsed.data.expectedVersion !== currentVersion) return responseError("Experience draft changed in another session. Reload before saving.", id, 409);
    const page = { ...parsed.data.page, status: "DRAFT" as const, version: currentVersion + 1 };
    try {
      if (before) {
        const updated = await repo.cms.run<{ count: number }>((db: any) => db.runtimeConfiguration.updateMany({ where: { id: before.id, version: currentVersion }, data: { value: page, isActive: true, updatedBy: actor.sub, version: { increment: 1 } } }));
        if (updated.count !== 1) return responseError("Experience draft changed in another session. Reload before saving.", id, 409);
      } else {
        await repo.cms.run((db: any) => db.runtimeConfiguration.create({ data: { scope: "HOMEPAGE", key: EXPERIENCE_PAGE_V2_DRAFT_KEY, value: page, isActive: true, createdBy: actor.sub, updatedBy: actor.sub, version: 1 } }));
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return responseError("Experience draft changed in another session. Reload before saving.", id, 409);
      throw error;
    }
    const row = await repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_PAGE_V2_DRAFT_KEY } });
    if (!row) return responseError("Experience draft save could not be confirmed.", id, 500);
    await writeActivity({ actorId: actor.sub, action: "experience.draft.save", entityType: "ExperiencePageV2", entityId: row.id, requestId: id, metadata: { version: row.version, status: "DRAFT" } }, repo);
    await writeAudit({ actorId: actor.sub, action: before ? "UPDATE" : "CREATE", entityType: "ExperiencePageV2", entityId: row.id, before: before?.value, after: page, requestId: id, reason: "Draft saved from P25 Experience Studio" }, repo);
    return responseJson({ page, draftVersion: row.version, published: false, publicationAuthority: "NONE_PR3" }, id);
  } catch (error) { return handleError(error, id); }
}
