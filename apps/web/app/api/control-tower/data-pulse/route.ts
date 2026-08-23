import { type NextRequest } from "next/server";
import { responseJson } from "@/lib/server/domainHttp";
import { handleError, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";
import { loadControlTowerDataPulse } from "@/lib/server/controlTowerDataPulse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "content:read");
    const pulse = await loadControlTowerDataPulse({ userId: actor.sub, roles: actor.roles });
    return responseJson(pulse, id);
  } catch (error) {
    return handleError(error, id);
  }
}
