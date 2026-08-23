import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCookies } from "@/lib/server/auth/cookies";
import { clientMeta, jsonError, loginSchema } from "@/lib/server/auth/http";
import { getAuthService } from "@/lib/server/auth/runtime";
import { loginFailureStatus } from "@/lib/server/auth/errors";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

function logLoginUnavailable(requestId: string, boundary: "rate-limit" | "auth-service", error?: unknown) {
  console.error(JSON.stringify({
    level: "error",
    message: "SALORA sign-in is temporarily unavailable.",
    route: "/api/auth/login",
    requestId,
    boundary,
    errorName: error instanceof Error ? error.name : undefined
  }));
}

function noStore(response: NextResponse) {
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid login payload.", 400, requestId);
    }

    const result = await getAuthService().login(parsed.data, clientMeta(request));
    return applyAuthCookies(NextResponse.json({ ...result, requestId }, { headers: { "x-request-id": requestId } }), result);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) {
      if (limited.status === 503) logLoginUnavailable(requestId, "rate-limit", error);
      return limited;
    }

    const status = loginFailureStatus(error);
    if (status === 401) {
      return noStore(jsonError("Invalid SALORA credentials.", status, requestId));
    }

    logLoginUnavailable(requestId, "auth-service", error);
    const response = noStore(jsonError("Authentication service is temporarily unavailable.", status, requestId));
    response.headers.set("retry-after", "5");
    return response;
  }
}
