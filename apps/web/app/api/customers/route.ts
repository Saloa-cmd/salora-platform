import { createCustomer, customerInputSchema, listCustomers } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, responseError, responseJson } from "@/lib/server/domainHttp";

export function GET(request: NextRequest) {
  return responseJson(listCustomers(), request.headers.get("x-request-id") || crypto.randomUUID());
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const parsed = await parseJson(request, customerInputSchema);
  return parsed.success ? responseJson(createCustomer(parsed.data), requestId, 201) : responseError("Invalid customer payload.", requestId);
}
