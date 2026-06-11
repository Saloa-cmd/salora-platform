import { products } from "@salora/data";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.DIAGNOSTICS_TOKEN;

  if (!token && process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(token) && request.headers.get("x-salora-diagnostics-token") === token;
}

export function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Diagnostics token required", requestId }, { status: 403 });
  }

  return NextResponse.json({
    requestId,
    service: "salora-web",
    runtime: "nextjs",
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    catalogItems: products.length,
    release: process.env.SENTRY_RELEASE || process.env.RELEASE_VERSION || "local",
    checkedAt: new Date().toISOString()
  });
}
