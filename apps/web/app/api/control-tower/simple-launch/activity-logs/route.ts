import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { responseJson } from "@/lib/server/domainHttp";
import { handleError, pagination, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "system:write");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const requestIdFilter = request.nextUrl.searchParams.get("requestId");
    const entityType = request.nextUrl.searchParams.get("entityType");
    const where = {
      ...(requestIdFilter ? { requestId: requestIdFilter } : {}),
      ...(entityType ? { entityType } : {})
    };
    const { take, skip } = pagination(request, { limit: 100, maxLimit: 100 });
    const logs = await repo.activityLogs.findMany({ where, orderBy: { createdAt: "desc" }, take, skip });
    return responseJson(logs, id);
  } catch (error) {
    return handleError(error, id);
  }
}
