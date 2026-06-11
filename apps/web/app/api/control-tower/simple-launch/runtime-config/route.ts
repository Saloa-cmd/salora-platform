import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { assertNonSecretKey, handleError, parseBody, requireControlPermission, requestId, runtimeConfigMutationSchema, writeActivity, writeAudit } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const configs = await repo.runtimeConfig.findMany({ where: { isActive: true }, orderBy: [{ scope: "asc" }, { key: "asc" }] });
    return responseJson(configs.filter((config: any) => {
      try {
        assertNonSecretKey(config.key);
        return true;
      } catch {
        return false;
      }
    }), id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function PATCH(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseBody(request, runtimeConfigMutationSchema);
    if (!parsed.success) return responseError("Invalid runtime configuration payload.", id);
    const input = parsed.data;
    assertNonSecretKey(input.key);
    const before = await repo.runtimeConfig.findUnique({ scope_key: { scope: input.scope, key: input.key } });
    const config = await repo.runtimeConfig.upsert(
      { scope_key: { scope: input.scope, key: input.key } },
      { scope: input.scope, key: input.key, value: input.value, isActive: input.isActive, createdBy: actor.sub, updatedBy: actor.sub, version: before ? { increment: 1 } : undefined }
    );
    await writeActivity({ actorId: actor.sub, action: "runtimeConfig.update", entityType: "RuntimeConfiguration", entityId: config.id, requestId: id, metadata: { scope: input.scope, key: input.key } }, repo);
    await writeAudit({ actorId: actor.sub, action: before ? "UPDATE" : "CREATE", entityType: "RuntimeConfiguration", entityId: config.id, before, after: config, requestId: id }, repo);
    return responseJson(config, id);
  } catch (error) {
    return handleError(error, id);
  }
}
