import { inventoryInputSchema, listInventoryMovements, recordInventoryMovement } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export function GET(request: NextRequest) {
  return responseJson(listInventoryMovements(), request.headers.get("x-request-id") || crypto.randomUUID());
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "catalog:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, inventoryInputSchema);
  return parsed.success ? responseJson(recordInventoryMovement(parsed.data), requestId, 201) : responseError("Invalid inventory payload.", requestId);
}
