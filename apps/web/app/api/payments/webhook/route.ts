import { getPaymentEnv, processPaymentWebhook, redactPaymentError } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "stripe");
    const env = getPaymentEnv();
    if (env.PAYMENTS_ENABLED !== "true" || env.PAYMENT_PROVIDER !== "stripe") {
      return responseError("Payment webhooks are unavailable.", requestId, 404);
    }
    const requestedProvider = request.nextUrl.searchParams.get("provider");
    if (requestedProvider && requestedProvider !== "stripe") {
      return responseError("Unknown payment provider.", requestId, 404);
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 1_000_000) return responseError("Webhook payload is too large.", requestId, 413);
    const rawBody = await request.text();
    const result = await processPaymentWebhook({
      providerName: "stripe",
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
