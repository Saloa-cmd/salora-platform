import { type NextRequest } from "next/server";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { activate117AndPublishV2 } from "@/lib/server/p36Activate117";
import { handleError, parseBody, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";
import { invalidateMenuAuthorityCache } from "@/lib/server/menuAuthority";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({ action: z.literal("activate-and-publish"), approvalToken: z.literal("ACTIVATE117") }).strict();

export async function POST(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    if (!actor.roles.includes("ADMIN")) return responseError("Forbidden.", id, 403);
    const parsed = await parseBody(request, requestSchema);
    if (!parsed.success) return responseError("Invalid ACTIVATE117 request.", id, 400);
    const result = await activate117AndPublishV2({ actorId: actor.sub, roles: actor.roles, requestId: id });
    invalidateMenuAuthorityCache();
    return responseJson(result, id);
  } catch (error) {
    return handleError(error, id);
  }
}
