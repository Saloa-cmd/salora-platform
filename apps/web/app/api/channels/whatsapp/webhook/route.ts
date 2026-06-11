import { products } from "@salora/data";
import { handleWhatsAppWebhook, verifyWhatsAppChallenge, verifyWhatsAppSignature } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function GET(request: NextRequest) {
  const challenge = verifyWhatsAppChallenge({
    mode: request.nextUrl.searchParams.get("hub.mode"),
    token: request.nextUrl.searchParams.get("hub.verify_token"),
    challenge: request.nextUrl.searchParams.get("hub.challenge")
  });

  if (challenge === undefined) {
    return responseError("WhatsApp webhook verification failed.", crypto.randomUUID(), 403);
  }

  return new Response(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const rawBody = await request.text();

  if (!verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return responseError("Invalid WhatsApp webhook signature.", requestId, 401);
  }

  const payload = JSON.parse(rawBody || "{}") as unknown;
  try {
    await enforceRateLimit(request, "whatsapp");
    const result = await handleWhatsAppWebhook(payload, products);
    return responseJson(result, requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return responseError("WhatsApp webhook could not be processed.", requestId, 500);
  }
}
