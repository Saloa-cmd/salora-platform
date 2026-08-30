import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientMeta, jsonError } from "@/lib/server/auth/http";
import { confirmPasswordReset, PasswordResetTokenError } from "@/lib/server/auth/passwordReset";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(40).max(256),
  password: z.string().min(16).max(256)
    .regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
}).strict();
const noStore = (response: NextResponse) => { response.headers.set("cache-control", "no-store, max-age=0"); return response; };

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noStore(jsonError("Invalid password reset payload.", 400, requestId));
    const result = await confirmPasswordReset({ ...parsed.data, ...clientMeta(request), requestId });
    return NextResponse.json({ ...result, requestId }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    if (error instanceof PasswordResetTokenError) return noStore(jsonError("Password reset link is invalid or expired.", 409, requestId));
    console.error(JSON.stringify({ level: "error", message: "Password reset confirmation failed safely.", route: "/api/auth/password-reset/confirm", requestId, errorName: error instanceof Error ? error.name : undefined }));
    return noStore(jsonError("Password reset is temporarily unavailable.", 503, requestId));
  }
}
