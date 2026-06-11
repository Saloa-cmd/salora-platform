import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, refreshTokenCookieName } from "@/lib/server/auth/cookies";
import { jsonError, refreshSchema } from "@/lib/server/auth/http";
import { getAuthService } from "@/lib/server/auth/runtime";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const body = await request.json().catch(() => null);
  const parsed = refreshSchema.safeParse(body);
  const refreshToken = parsed.success ? parsed.data.refreshToken : request.cookies.get(refreshTokenCookieName)?.value;

  if (!refreshToken) {
    return jsonError("Invalid logout payload.", 400, requestId);
  }

  await getAuthService().logout(refreshToken);
  return clearAuthCookies(NextResponse.json({ ok: true, requestId }, { headers: { "x-request-id": requestId } }));
}
