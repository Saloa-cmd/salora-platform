import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCookies } from "@/lib/server/auth/cookies";
import { clientMeta, jsonError, loginSchema } from "@/lib/server/auth/http";
import { getAuthService } from "@/lib/server/auth/runtime";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

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
    if (limited) return limited;
    return jsonError("Invalid SALORA credentials.", 401, requestId);
  }
}
