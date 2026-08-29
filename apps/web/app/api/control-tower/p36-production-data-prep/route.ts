import { type NextRequest } from "next/server";
import { z } from "zod";
import { p36ProductionDataPrepApproval } from "@/lib/control-tower/p36ActivationManifest";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { prepareP36ProductionData } from "@/lib/server/p36ProductionDataPrep";
import { handleError, parseBody, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  action: z.literal("prepare"),
  approvalToken: z.literal(p36ProductionDataPrepApproval.token)
}).strict();

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    if (!actor.roles.includes("ADMIN")) return responseError("Forbidden.", id, 403);
    const parsed = await parseBody(request, requestSchema);
    if (!parsed.success) return responseError("Invalid P36 Production data preparation request.", id, 400);
    const result = await prepareP36ProductionData({ sourceOrigin: request.nextUrl.origin, actorId: actor.sub, roles: actor.roles, requestId: id });
    return responseJson(result, id);
  } catch (error) {
    return handleError(error, id);
  }
}
