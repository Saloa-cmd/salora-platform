import { incrementMetric, recordDuration } from "@salora/backend";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const allowedMetrics = new Set([
  "dashboard_widget_load_ms",
  "control_tower_widget_load_ms"
]);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const body = await request.json().catch(() => null) as { metric?: string; value?: number } | null;

  if (!body?.metric || !allowedMetrics.has(body.metric) || typeof body.value !== "number" || !Number.isFinite(body.value)) {
    return NextResponse.json({ requestId, error: "Invalid telemetry payload." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  recordDuration(`salora_${body.metric}`, Math.max(0, Math.min(body.value, 120_000)));
  incrementMetric("salora_dashboard_telemetry_events_total");

  return NextResponse.json({ requestId, ok: true }, { headers: { "x-request-id": requestId } });
}
