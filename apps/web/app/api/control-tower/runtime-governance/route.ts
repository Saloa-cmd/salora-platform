import { type NextRequest } from "next/server";
import { responseJson } from "@/lib/server/domainHttp";
import { handleError, requireControlPermission, requestId } from "@/lib/server/simpleLaunchControl";
import { providerReadiness } from "@/lib/server/supremacyControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    await requireControlPermission(request, "system:read");
    return responseJson(await providerReadiness(), id);
  } catch (error) {
    return handleError(error, id);
  }
}
