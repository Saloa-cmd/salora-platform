import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientMeta, jsonError } from "@/lib/server/auth/http";
import { PasswordResetConfigurationError, requestPasswordReset } from "@/lib/server/auth/passwordReset";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ email: z.string().email().max(255) }).strict();
const accepted = (requestId: string) => NextResponse.json({ accepted: true, requestId }, { status: 202, headers: { "cache-control": "no-store, max-age=0" } });
const noStore = (response: NextResponse) => { response.headers.set("cache-control", "no-store, max-age=0"); return response; };

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noStore(jsonError("Invalid password reset request.", 400, requestId));
    const subject = createHash("sha256").update(parsed.data.email.trim().toLowerCase()).digest("hex");
    await enforceRateLimit(request, "auth", `password-reset:${subject}`);
    await requestPasswordReset(parsed.data.email, { ...clientMeta(request), requestId });
    return accepted(requestId);
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    if (error instanceof PasswordResetConfigurationError) return noStore(jsonError("Password reset is temporarily unavailable.", 503, requestId));
    console.error(JSON.stringify({ level: "error", message: "Password reset request failed safely.", route: "/api/auth/password-reset/request", requestId, errorName: error instanceof Error ? error.name : undefined }));
    return accepted(requestId);
  }
}
