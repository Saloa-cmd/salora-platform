import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { defaultExperienceConfiguration, EXPERIENCE_DRAFT_KEY, EXPERIENCE_PUBLISHED_KEY, experienceConfigurationSchema, parseExperienceConfiguration } from "@/lib/experience/config";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), configuration: experienceConfigurationSchema }),
  z.object({ action: z.literal("publish"), configuration: experienceConfigurationSchema }),
  z.object({ action: z.literal("rollback"), revisionId: z.string().uuid() })
]);

async function upsertConfiguration(repo: Awaited<ReturnType<typeof createControlTowerRepository>>, key: string, value: unknown, actorId: string) {
  const before = await repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key } });
  const row = await repo.runtimeConfig.upsert(
    { scope_key: { scope: "HOMEPAGE", key } },
    { scope: "HOMEPAGE", key, value, isActive: true, createdBy: before?.createdBy ?? actorId, updatedBy: actorId, version: (before?.version ?? 0) + 1 }
  );
  return { before, row };
}

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const [draft, published, history] = await Promise.all([
      repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_DRAFT_KEY } }),
      repo.runtimeConfig.findUnique({ scope_key: { scope: "HOMEPAGE", key: EXPERIENCE_PUBLISHED_KEY } }),
      repo.auditLogs.findMany({ where: { entityType: "ExperienceConfiguration", action: { in: ["UPDATE", "RESTORE"] } }, orderBy: { createdAt: "desc" }, take: 20 })
    ]);
    return responseJson({
      draft: draft ? parseExperienceConfiguration(draft.value) : defaultExperienceConfiguration,
      published: published ? parseExperienceConfiguration(published.value) : defaultExperienceConfiguration,
      draftVersion: draft?.version ?? 0,
      publishedVersion: published?.version ?? 0,
      history: history.map((revision: any) => ({ id: revision.id, action: revision.action, createdAt: revision.createdAt, actorId: revision.actorId, reason: revision.reason }))
    }, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function PATCH(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, mutationSchema);
    if (!parsed.success) return responseError("Invalid visual experience configuration.", id, 422);

    let configuration = "configuration" in parsed.data ? parsed.data.configuration : undefined;
    let auditAction: "UPDATE" | "RESTORE" = "UPDATE";
    let reason = parsed.data.action === "publish" ? "Published from SALORA Experience Studio" : "Draft saved from SALORA Experience Studio";

    if (parsed.data.action === "rollback") {
      const revisions = await repo.auditLogs.findMany({ where: { id: parsed.data.revisionId, entityType: "ExperienceConfiguration" }, take: 1 });
      const revision = revisions[0];
      if (!revision?.after) return responseError("Revision not found.", id, 404);
      const restored = experienceConfigurationSchema.safeParse(revision.after);
      if (!restored.success) return responseError("Revision is no longer compatible.", id, 409);
      configuration = restored.data;
      auditAction = "RESTORE";
      reason = `Restored revision ${parsed.data.revisionId}`;
    }

    if (!configuration) return responseError("Configuration is required.", id, 422);
    const draftResult = await upsertConfiguration(repo, EXPERIENCE_DRAFT_KEY, configuration, actor.sub);
    let publishedResult = null;
    if (parsed.data.action === "publish" || parsed.data.action === "rollback") {
      publishedResult = await upsertConfiguration(repo, EXPERIENCE_PUBLISHED_KEY, configuration, actor.sub);
      revalidatePath("/");
      revalidatePath("/menu");
      revalidatePath("/api/experience");
    }

    await writeActivity({ actorId: actor.sub, action: `experience.${parsed.data.action}`, entityType: "ExperienceConfiguration", entityId: publishedResult?.row.id ?? draftResult.row.id, requestId: id, metadata: { version: publishedResult?.row.version ?? draftResult.row.version } }, repo);
    await writeAudit({ actorId: actor.sub, action: auditAction, entityType: "ExperienceConfiguration", entityId: publishedResult?.row.id ?? draftResult.row.id, before: publishedResult?.before?.value ?? draftResult.before?.value, after: configuration, requestId: id, reason }, repo);
    return responseJson({ configuration, draftVersion: draftResult.row.version, publishedVersion: publishedResult?.row.version, published: Boolean(publishedResult) }, id);
  } catch (error) {
    return handleError(error, id);
  }
}
