import { runtimeConfigInputSchema } from "@salora/backend";
import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/repositories/control-tower";
import { parseJson, responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, requireControlPermission } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const records = await repo.runtimeConfig.findMany({ orderBy: [{ scope: "asc" }, { key: "asc" }] });
    return responseJson({ persistence: "database", records }, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const parsed = await parseJson(request, runtimeConfigInputSchema);

    if (!parsed.success) {
      return responseError("Invalid runtime configuration payload.", requestId);
    }

    const input = parsed.data;
    const record = await repo.runtimeConfig.upsert(
      { scope_key: { scope: input.scope, key: input.key } },
      { scope: input.scope, key: input.key, value: input.value, isActive: input.isActive }
    );
    return responseJson({ persistence: "database", record }, requestId, 201);
  } catch (error) {
    return handleError(error, requestId);
  }
}
