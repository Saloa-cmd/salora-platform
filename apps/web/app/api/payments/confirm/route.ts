import { confirmPaymentSchema, confirmRevenuePayment, redactPaymentError } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "stripe");
    const parsed = await parseJson(request, confirmPaymentSchema);
    if (!parsed.success) return responseError("Invalid payment confirmation payload.", requestId, 400);

    const result = await confirmRevenuePayment(parsed.data);
    return responseJson(result, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError(redactPaymentError(error), requestId, 400);
  }
}
