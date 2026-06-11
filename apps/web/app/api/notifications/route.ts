import { listNotifications, notificationInputSchema, queueNotification } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export function GET(request: NextRequest) {
  return responseJson(listNotifications(), request.headers.get("x-request-id") || crypto.randomUUID());
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "system:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, notificationInputSchema);
  return parsed.success ? responseJson(queueNotification(parsed.data), requestId, 201) : responseError("Invalid notification payload.", requestId);
}
