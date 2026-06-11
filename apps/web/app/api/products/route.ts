import { createProduct, productInputSchema } from "@salora/backend";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const snapshot = await getPublicMenuSnapshot();
  const response = NextResponse.json(
    {
      requestId,
      data: snapshot.products,
      runtime: {
        source: snapshot.source,
        stale: snapshot.stale,
        mode: snapshot.runtimeMode,
        databaseHealth: snapshot.databaseHealth
      }
    },
    { headers: { "x-request-id": requestId } }
  );
  response.headers.set("x-salora-data-source", snapshot.source);
  response.headers.set("x-salora-stale", String(snapshot.stale));
  response.headers.set("x-salora-database-health", snapshot.databaseHealth);
  return response;
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "catalog:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, productInputSchema);
  return parsed.success ? responseJson(createProduct(parsed.data), requestId, 201) : responseError("Invalid product payload.", requestId);
}
