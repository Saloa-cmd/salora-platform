import { processPaymentWebhook, redactPaymentError } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const rawBody = await request.text();
  const provider = request.nextUrl.searchParams.get("provider") === "stripe" ? "stripe" : "mock";

  try {
    await enforceRateLimit(request, "stripe");
    const result = await processPaymentWebhook({
      providerName: provider,
      rawBody,
      signature: request.headers.get("stripe-signature")
    });
    return responseJson(result, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError(redactPaymentError(error), requestId, 400);
  }
}
