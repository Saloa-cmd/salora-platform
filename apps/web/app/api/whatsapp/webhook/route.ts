import { products } from "@salora/data";
import { createWhatsAppEnterpriseWebhook } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || crypto.randomUUID();
  const webhook = createWhatsAppEnterpriseWebhook();
  const challenge = webhook.verify({
    mode: request.nextUrl.searchParams.get("hub.mode"),
    token: request.nextUrl.searchParams.get("hub.verify_token"),
    challenge: request.nextUrl.searchParams.get("hub.challenge")
  });

  if (challenge === undefined) {
    return responseError("WhatsApp webhook verification failed.", correlationId, 403);
  }

  return new Response(challenge, { status: 200, headers: { "x-request-id": correlationId, "x-correlation-id": correlationId } });
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || crypto.randomUUID();
  const rawBody = await request.text();
  const webhook = createWhatsAppEnterpriseWebhook();

  if (!webhook.verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return responseError("Invalid WhatsApp webhook signature.", correlationId, 401);
  }

  const payload = JSON.parse(rawBody || "{}") as unknown;
  try {
    await enforceRateLimit(request, "whatsapp");
    const result = await webhook.process(payload, products, correlationId);
    return responseJson(result, correlationId);
  } catch (error) {
    const limited = rateLimitResponse(error, correlationId);
    if (limited) return limited;
    return responseError("WhatsApp webhook could not be processed and was retained for dead-letter handling.", correlationId, 500);
  }
}
