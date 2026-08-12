import { combineStatus, dashboardFetch, requestIdsFrom } from "./client";
import type { DashboardResult, OperationsEnvelope, WhatsappDashboardData } from "./types";

type HealthResponse = {
  status: "ok";
};

export async function getWhatsappDashboard(): Promise<DashboardResult<WhatsappDashboardData>> {
  const [operations, health] = await Promise.all([
    dashboardFetch<OperationsEnvelope>("/api/intelligence/operations"),
    fetch("/api/health", { cache: "no-store" }).then(async (response): Promise<DashboardResult<HealthResponse>> => ({
      status: response.ok ? "ok" as const : "error" as const,
      requestIds: [response.headers.get("x-request-id") ?? crypto.randomUUID()],
      data: await response.json().catch(() => undefined) as HealthResponse | undefined,
      message: response.ok ? undefined : "Health endpoint returned an error."
    })).catch((error): DashboardResult<HealthResponse> => ({
      status: "error" as const,
      requestIds: [crypto.randomUUID()],
      data: undefined,
      message: error instanceof Error ? error.message : "Health endpoint failed."
    }))
  ]);
  const status = combineStatus([operations, health]);

  if (!operations.data) {
    return {
      status,
      requestIds: requestIdsFrom([operations, health]),
      message: operations.message
    };
  }

  const ready = operations.data.operations.whatsappDashboardReady;
  const webRuntimeLive = health.data?.status === "ok";

  return {
    status,
    requestIds: requestIdsFrom([operations, health]),
    data: {
      metrics: [
        { label: "Conversations", value: "Unavailable", detail: "No WhatsApp conversation aggregate API yet", status: "empty" },
        { label: "Inbound messages", value: "Unavailable", detail: "Channel message direction metrics are not exposed", status: "empty" },
        { label: "Outbound messages", value: "Unavailable", detail: "Channel message direction metrics are not exposed", status: "empty" },
        { label: "Webhook health", value: ready ? "Ready" : "Unavailable", detail: "Derived from operations readiness", status: ready ? "warning" : "empty" },
        { label: "Response latency", value: "Unavailable", detail: "Latency metric not exposed", status: "empty" },
        { label: "AI-assisted replies", value: "Unavailable", detail: "Reply attribution metric not exposed", status: "empty" },
        { label: "Order assistance", value: "Unavailable", detail: "Order-intent metric not exposed", status: "empty" },
        { label: "Loyalty assistance", value: "Unavailable", detail: "Loyalty-intent metric not exposed", status: "empty" }
      ],
      channelHealth: [
        { label: "Webhook route", status: webRuntimeLive ? "warning" : "error", detail: webRuntimeLive ? "Platform is live; WhatsApp webhook requires channel event telemetry" : health.message ?? "Health unavailable" },
        { label: "Operations readiness", status: ready ? "warning" : "empty", detail: ready ? "Dashboard readiness flag is true; exact counters pending" : "Operations reports WhatsApp dashboard unavailable" }
      ],
      assistance: [
        { label: "AI replies", status: "empty", detail: "Requires WhatsApp assistant attribution API" },
        { label: "Order assistance", status: "empty", detail: "Requires intent classification events" },
        { label: "Loyalty assistance", status: "empty", detail: "Requires loyalty assistance events" }
      ],
      emptyStates: [
        { id: "whatsapp-conversations", title: "Conversation metrics unavailable", detail: "Create a channel intelligence API before showing counts.", severity: "info" },
        { id: "whatsapp-latency", title: "Latency metrics unavailable", detail: "Webhook timing is not yet exposed as a dashboard contract.", severity: "info" }
      ]
    }
  };
}
