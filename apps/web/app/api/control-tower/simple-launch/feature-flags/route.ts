import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { featureFlagMutationSchema, handleError, parseBody, requireControlPermission, requestId, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const environment = request.nextUrl.searchParams.get("environment") ?? "staging";
    const flags = await repo.featureFlags.findMany({ where: { environment, deletedAt: null }, orderBy: { key: "asc" } });
    return responseJson(flags, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function PATCH(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, featureFlagMutationSchema);
    if (!parsed.success) return responseError("Invalid feature flag payload.", id);
    const input = parsed.data;
    const before = await repo.featureFlags.findUnique({ key_environment: { key: input.key, environment: input.environment } });
    const flag = await repo.featureFlags.upsert(
      { key_environment: { key: input.key, environment: input.environment } },
      { key: input.key, environment: input.environment, enabled: input.enabled, rules: {} }
    );
    await writeActivity({ actorId: actor.sub, action: "featureFlag.toggle", entityType: "FeatureFlag", entityId: flag.id, requestId: id, metadata: { key: input.key, environment: input.environment, enabled: input.enabled } }, repo);
    await writeAudit({ actorId: actor.sub, action: before ? "UPDATE" : "CREATE", entityType: "FeatureFlag", entityId: flag.id, before, after: flag, requestId: id }, repo);
    return responseJson(flag, id);
  } catch (error) {
    return handleError(error, id);
  }
}
