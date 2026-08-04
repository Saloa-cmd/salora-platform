import { createProduct, productInputSchema } from "@salora/backend";
import { NextResponse, type NextRequest } from "next/server";
import { parseJson, requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { getPublicMenuSnapshot } from "@/lib/server/publicMenu";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const snapshot = await getPublicMenuSnapshot();
    const response = NextResponse.json(
      {
        requestId,
        data: snapshot.products,
        authority: {
          collection: snapshot.collection,
          revision: snapshot.revision,
          sections: snapshot.sections
        },
        runtime: {
          source: snapshot.source,
          stale: snapshot.stale,
          mode: snapshot.runtimeMode,
          databaseHealth: snapshot.databaseHealth,
          generatedAt: snapshot.generatedAt
        }
      },
      { headers: { "x-request-id": requestId } }
    );
    response.headers.set("x-salora-data-source", snapshot.source);
    response.headers.set("x-salora-stale", String(snapshot.stale));
    response.headers.set("x-salora-database-health", snapshot.databaseHealth);
    response.headers.set("x-salora-menu-revision", snapshot.revision?.id ?? "legacy-catalog");
    response.headers.set("x-salora-menu-version", String(snapshot.revision?.version ?? 0));
    return response;
  } catch {
    return responseError("Published menu authority is unavailable.", requestId, 503);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  if (!(await requirePermission(request, "catalog:write"))) {
    return responseError("Forbidden.", requestId, 403);
  }
  const parsed = await parseJson(request, productInputSchema);
  return parsed.success
    ? responseJson(createProduct(parsed.data), requestId, 201)
    : responseError("Invalid product payload.", requestId);
}
