import { listNotifications, notificationInputSchema, queueNotification } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "system:read"))) return responseError("Forbidden.", requestId, 403);
  return responseJson(listNotifications(), requestId);
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "system:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, notificationInputSchema);
  return parsed.success ? responseJson(queueNotification(parsed.data), requestId, 201) : responseError("Invalid notification payload.", requestId);
}
