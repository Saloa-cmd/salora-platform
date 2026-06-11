import { NextResponse, type NextRequest } from "next/server";
import { currentAuthPayload, jsonError } from "@/lib/server/auth/http";
import { hasPermission } from "@/lib/server/auth/rbac";
import type { RoleName } from "@/lib/server/auth/types";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const payload = await currentAuthPayload(request);
    const roles = payload.roles as RoleName[];
    return NextResponse.json({
      requestId,
      user: {
        id: payload.sub,
        email: payload.email,
        roles
      },
      capabilities: {
        canManageCatalog: hasPermission(roles, "catalog:write"),
        canManageUsers: hasPermission(roles, "user:write"),
        canReadOrders: hasPermission(roles, "order:read")
      }
    });
  } catch {
    return jsonError("Unauthorized.", 401, requestId);
  }
}
