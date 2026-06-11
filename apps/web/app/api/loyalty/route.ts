import { awardLoyaltyPoints, listLoyaltyEntries, loyaltyInputSchema } from "@salora/backend";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";

export function GET(request: NextRequest) {
  return responseJson(listLoyaltyEntries(), request.headers.get("x-request-id") || crypto.randomUUID());
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "user:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, loyaltyInputSchema);
  return parsed.success ? responseJson(awardLoyaltyPoints(parsed.data), requestId, 201) : responseError("Invalid loyalty payload.", requestId);
}
