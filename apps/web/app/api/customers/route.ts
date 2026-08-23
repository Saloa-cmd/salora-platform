import { createCustomer, customerInputSchema, listCustomers } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "staff:read"))) return responseError("Forbidden.", requestId, 403);
  return responseJson(listCustomers(), requestId);
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "user:write"))) return responseError("Forbidden.", requestId, 403);
  const parsed = await parseJson(request, customerInputSchema);
  return parsed.success ? responseJson(createCustomer(parsed.data), requestId, 201) : responseError("Invalid customer payload.", requestId);
}
