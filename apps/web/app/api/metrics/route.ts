import { products } from "@salora/data";
import { collectQueueMetrics, collectRedisMetrics, renderInfrastructureMetrics } from "@salora/backend";
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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Metrics token required" }, { status: 403 });
  }

  const memory = process.memoryUsage();
  collectRedisMetrics();
  await collectQueueMetrics().catch(() => undefined);
  const body = [
    "# HELP salora_catalog_products Number of products loaded in the SALORA catalog.",
    "# TYPE salora_catalog_products gauge",
    `salora_catalog_products ${products.length}`,
    "# HELP salora_node_uptime_seconds Node.js process uptime in seconds.",
    "# TYPE salora_node_uptime_seconds gauge",
    `salora_node_uptime_seconds ${Math.round(process.uptime())}`,
    "# HELP salora_node_heap_used_bytes Node.js heap used in bytes.",
    "# TYPE salora_node_heap_used_bytes gauge",
    `salora_node_heap_used_bytes ${memory.heapUsed}`,
    renderInfrastructureMetrics()
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8"
    }
  });
}
