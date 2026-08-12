import { combineStatus, dashboardFetch, requestIdsFrom, statusFromScore } from "./client";
import type { DashboardAlert, DashboardResult, OperationsDashboardData, OperationsEnvelope, RuntimeStatus } from "./types";

type HealthResponse = {
  status: "ok";
};

export async function getOperationsDashboard(): Promise<DashboardResult<OperationsDashboardData>> {
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

  const ops = operations.data.operations;
  const inventory = operations.data.inventory;
  const inventoryAlerts: DashboardAlert[] = inventory.reorderRiskIngredients.map((ingredient) => ({
    id: ingredient,
    title: "Inventory reorder risk",
    detail: ingredient,
    severity: "warning"
  }));
  const runtimeAlerts = operations.data.alerts.map((alert) => ({
    id: alert.id,
    title: alert.type.replaceAll("_", " "),
    detail: alert.message,
    severity: alert.severity,
    createdAt: alert.createdAt
  }));
  const webRuntimeLive = health.data?.status === "ok";
  const systemHealth: RuntimeStatus[] = [
    { label: "Web runtime", status: webRuntimeLive ? "ok" : "error", detail: webRuntimeLive ? "Liveness probe passed" : health.message ?? "Health unavailable" },
    { label: "Forecasting", status: "warning", detail: operations.data.forecasting.requiredNextData.join(", ") }
  ];

  return {
    status,
    requestIds: requestIdsFrom([operations, health]),
    data: {
      metrics: [
        { label: "Order volume", value: String(ops.ordersTotal), detail: "Domain orders", status: "ok" },
        { label: "Queue health", value: String(ops.queuedNotifications), detail: "Queued notifications", status: ops.queuedNotifications ? "warning" : "ok" },
        { label: "Inventory alerts", value: String(inventory.inventoryRiskCount), detail: `${inventory.movementCount} movements`, status: inventory.inventoryRiskCount ? "warning" : "ok" },
        { label: "Payment failures", value: String(ops.failedPayments), detail: `${ops.paymentsTotal} payment attempts`, status: ops.failedPayments ? "critical" : "ok" },
        { label: "System health", value: `${ops.operationsHealthScore}/100`, detail: "Operations score", status: statusFromScore(ops.operationsHealthScore) }
      ],
      queueHealth: [
        { label: "Orders", status: ops.ordersDashboardReady ? "ok" : "empty", detail: ops.ordersDashboardReady ? "Orders dashboard contract ready" : "Orders dashboard unavailable" },
        { label: "Payments", status: ops.paymentsDashboardReady ? "ok" : "empty", detail: ops.paymentsDashboardReady ? "Payments contract ready" : "Payments dashboard unavailable" },
        { label: "Notifications", status: ops.queuedNotifications ? "warning" : "ok", detail: `${ops.queuedNotifications} queued` }
      ],
      inventoryAlerts,
      runtimeAlerts,
      systemHealth
    }
  };
}
