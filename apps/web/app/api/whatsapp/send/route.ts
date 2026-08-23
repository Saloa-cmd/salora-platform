import { createWhatsAppEnterpriseService, validateWhatsAppSend } from "@salora/backend";
import { type NextRequest } from "next/server";
import { requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    if (!(await requirePermission(request, "system:write"))) {
      return responseError("Forbidden.", correlationId, 403);
    }
    await enforceRateLimit(request, "whatsapp");
    const body = await request.json().catch(() => null);
    const parsed = validateWhatsAppSend({ ...(body ?? {}), correlationId: body?.correlationId ?? correlationId });
    const service = createWhatsAppEnterpriseService();
    const result = await service.send(parsed);
    return responseJson({ ...result, correlationId }, correlationId, result.delivery.status === "failed" ? 502 : 200);
  } catch (error) {
    const limited = rateLimitResponse(error, correlationId);
    if (limited) return limited;
    return responseError(error instanceof Error ? error.message : "WhatsApp send failed.", correlationId, 500);
  }
}
