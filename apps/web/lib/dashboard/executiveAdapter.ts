import { combineStatus, dashboardFetch, formatCurrency, formatPercent, requestIdsFrom, statusFromScore, trendFromValue } from "./client";
import type { AiAnalytics, DashboardResult, ExecutiveDashboardData, KpiSnapshot, OperationsEnvelope, RevenueAnalytics } from "./types";

export async function getExecutiveDashboard(): Promise<DashboardResult<ExecutiveDashboardData>> {
  const [kpis, revenue, operations, ai] = await Promise.all([
    dashboardFetch<KpiSnapshot>("/api/intelligence/kpis"),
    dashboardFetch<RevenueAnalytics>("/api/intelligence/revenue"),
    dashboardFetch<OperationsEnvelope>("/api/intelligence/operations"),
    dashboardFetch<AiAnalytics>("/api/intelligence/ai")
  ]);
  const status = combineStatus([kpis, revenue, operations, ai]);

  if (status !== "ok" && !kpis.data) {
    return {
      status,
      requestIds: requestIdsFrom([kpis, revenue, operations, ai]),
      message: kpis.message ?? revenue.message ?? operations.message ?? ai.message
    };
  }

  const snapshot = kpis.data;
  const revenueData = revenue.data ?? snapshot?.revenue;
  const operationsData = operations.data?.operations ?? snapshot?.operations;
  const inventoryData = operations.data?.inventory ?? snapshot?.inventory;
  const aiData = ai.data ?? snapshot?.ai;
  const customerData = snapshot?.customers;
  const loyaltyData = snapshot?.loyalty;
  const executive = snapshot?.executive;

  if (!revenueData || !operationsData || !aiData || !customerData || !loyaltyData || !executive) {
    return {
      status: "empty",
      requestIds: requestIdsFrom([kpis, revenue, operations, ai]),
      message: "Executive intelligence APIs returned an incomplete data contract."
    };
  }

  return {
    status,
    requestIds: requestIdsFrom([kpis, revenue, operations, ai]),
    data: {
      generatedAt: snapshot?.generatedAt,
      metrics: [
        { label: "Total revenue", value: formatCurrency(revenueData.grossRevenue), detail: "Gross captured revenue", status: statusFromScore(executive.revenueHealthScore) },
        { label: "Active orders", value: String(operationsData.ordersTotal), detail: "Orders in SALORA domain", status: statusFromScore(operationsData.operationsHealthScore) },
        { label: "Payment success", value: formatPercent(revenueData.paymentSuccessRate), detail: "Paid vs attempted payments", status: statusFromScore(executive.revenueHealthScore) },
        { label: "AI request volume", value: String(aiData.requestCount), detail: "Evaluation records observed", status: statusFromScore(aiData.aiEffectivenessScore) },
        { label: "WhatsApp activity", value: operationsData.whatsappDashboardReady ? "Ready" : "Unavailable", detail: "Channel dashboard readiness", status: operationsData.whatsappDashboardReady ? "warning" : "empty" },
        { label: "Customer health", value: `${customerData.customerHealthScore}/100`, detail: `${customerData.customerCount} customers`, status: statusFromScore(customerData.customerHealthScore) },
        { label: "Loyalty activity", value: `${loyaltyData.loyaltyEngagementScore}/100`, detail: `${loyaltyData.activeLoyaltyAccounts} active accounts`, status: statusFromScore(loyaltyData.loyaltyEngagementScore) },
        { label: "Runtime health", value: `${operationsData.operationsHealthScore}/100`, detail: inventoryData ? `${inventoryData.inventoryRiskCount} inventory risks` : "Operations health", status: statusFromScore(operationsData.operationsHealthScore) }
      ],
      revenueTrend: trendFromValue("Now", revenueData.netRevenue),
      runtime: [
        { label: "Operations", status: statusFromScore(operationsData.operationsHealthScore), detail: `${operationsData.failedPayments} failed payments, ${operationsData.queuedNotifications} queued notifications` },
        { label: "Inventory", status: statusFromScore(inventoryData?.inventoryHealthScore ?? 0), detail: inventoryData?.reorderRiskIngredients.length ? inventoryData.reorderRiskIngredients.join(", ") : "No reorder risks reported" },
        { label: "AI", status: statusFromScore(aiData.aiEffectivenessScore), detail: `${aiData.safetyBlockCount} safety blocks` }
      ],
      alerts: (operations.data?.alerts ?? []).map((alert) => ({
        id: alert.id,
        title: alert.type.replaceAll("_", " "),
        detail: alert.message,
        severity: alert.severity,
        createdAt: alert.createdAt
      }))
    }
  };
}
