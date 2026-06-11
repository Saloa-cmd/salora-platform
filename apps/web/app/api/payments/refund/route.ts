import { createRevenueRefund, redactPaymentError, refundPaymentSchema } from "@salora/backend";
import { type NextRequest } from "next/server";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { hasRole } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";
import { parseJson, responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await enforceRateLimit(request, "stripe");
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError(redactPaymentError(error), requestId, 400);
  }

  try {
    const payload = await currentAuthPayload(request);
    if (!hasRole(payload.roles as RoleName[], ["MANAGER", "ADMIN"])) {
      return responseError("Forbidden.", requestId, 403);
    }
  } catch {
    return responseError("Unauthorized.", requestId, 401);
  }

  const parsed = await parseJson(request, refundPaymentSchema);
  if (!parsed.success) return responseError("Invalid refund payload.", requestId, 400);

  try {
    const result = await createRevenueRefund(parsed.data);
    return responseJson(result, requestId, 201);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError(redactPaymentError(error), requestId, 400);
  }
}
