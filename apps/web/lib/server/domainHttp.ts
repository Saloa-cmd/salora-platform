import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { currentAuthPayload } from "./auth/http";
import { hasPermission } from "./auth/rbac";
import type { RoleName } from "./auth/types";

export async function parseJson<T>(request: NextRequest, schema: ZodType<T>) {
  const body = await request.json().catch(() => null);
  return schema.safeParse(body);
}

export function responseJson(data: unknown, requestId: string, status = 200) {
  return NextResponse.json({ requestId, data }, { status, headers: { "x-request-id": requestId } });
}

export function responseError(error: string, requestId: string, status = 400) {
  return NextResponse.json({ requestId, error }, { status, headers: { "x-request-id": requestId } });
}

export async function requirePermission(request: NextRequest, permission: string): Promise<boolean> {
  try {
    const payload = await currentAuthPayload(request);
    return hasPermission(payload.roles as RoleName[], permission);
  } catch {
    return false;
  }
}
