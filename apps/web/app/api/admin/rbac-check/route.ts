import { NextResponse, type NextRequest } from "next/server";
import { currentAuthPayload, jsonError } from "@/lib/server/auth/http";
import { hasRole } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const payload = await currentAuthPayload(request);
    const roles = payload.roles as RoleName[];

    if (!hasRole(roles, ["MANAGER", "ADMIN"])) {
      return jsonError("Forbidden.", 403, requestId);
    }

    return NextResponse.json({ ok: true, requestId, roles });
  } catch {
    return jsonError("Unauthorized.", 401, requestId);
  }
}
