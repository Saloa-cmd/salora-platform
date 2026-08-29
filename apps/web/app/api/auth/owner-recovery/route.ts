import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientMeta, jsonError } from "@/lib/server/auth/http";
import { OwnerRecoveryUnavailableError, ownerRecoveryAvailable, recoverOwnerAdmin } from "@/lib/server/auth/ownerRecovery";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const recoverySchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(2).max(120),
  recoveryToken: z.string().min(32).max(512),
  password: z.string().min(16).max(256)
    .regex(/[a-z]/, "Password requires a lowercase letter.")
    .regex(/[A-Z]/, "Password requires an uppercase letter.")
    .regex(/[0-9]/, "Password requires a number.")
    .regex(/[^A-Za-z0-9]/, "Password requires a symbol.")
}).strict();

function noStore(response: NextResponse) {
  response.headers.set("cache-control", "no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    return noStore(NextResponse.json({ available: await ownerRecoveryAvailable(), requestId }));
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    return noStore(NextResponse.json({ available: false, requestId }, { status: 503 }));
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  try {
    await enforceRateLimit(request, "auth");
    const parsed = recoverySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noStore(jsonError("Invalid owner recovery payload.", 400, requestId));
    const result = await recoverOwnerAdmin({ ...parsed.data, ...clientMeta(request), requestId });
    return noStore(NextResponse.json({ recovered: true, ...result, requestId }, { status: 201 }));
  } catch (error) {
    const limited = rateLimitResponse(error, requestId);
    if (limited) return limited;
    if (error instanceof OwnerRecoveryUnavailableError) return noStore(jsonError("Owner recovery is unavailable or already completed.", 409, requestId));
    console.error(JSON.stringify({ level: "error", message: "Owner recovery failed safely.", route: "/api/auth/owner-recovery", requestId, errorName: error instanceof Error ? error.name : undefined }));
    return noStore(jsonError("Owner recovery failed safely.", 500, requestId));
  }
}
