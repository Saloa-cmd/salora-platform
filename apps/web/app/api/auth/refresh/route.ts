import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCookies, refreshTokenCookieName } from "@/lib/server/auth/cookies";
import { clientMeta, jsonError, refreshSchema } from "@/lib/server/auth/http";
import { getAuthService } from "@/lib/server/auth/runtime";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    const body = await request.json().catch(() => null);
    const parsed = refreshSchema.safeParse(body);
    const refreshToken = parsed.success ? parsed.data.refreshToken : request.cookies.get(refreshTokenCookieName)?.value;

    if (!refreshToken) {
      return jsonError("Invalid refresh payload.", 400, requestId);
    }

    const result = await getAuthService().refresh(refreshToken, clientMeta(request));
    return applyAuthCookies(NextResponse.json({ ...result, requestId }, { headers: { "x-request-id": requestId } }), result);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return jsonError("Refresh token is not active.", 401, requestId);
  }
}
