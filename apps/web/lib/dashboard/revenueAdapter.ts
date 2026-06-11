import { dashboardFetch, formatCurrency, formatPercent, statusFromScore, trendFromValue } from "./client";
import type { DashboardResult, RevenueAnalytics, RevenueDashboardData } from "./types";

export async function getRevenueDashboard(): Promise<DashboardResult<RevenueDashboardData>> {
  const result = await dashboardFetch<RevenueAnalytics>("/api/intelligence/revenue");
  if (!result.data) return { ...result, data: undefined };

  const revenue = result.data;
  const channelRevenue = Object.entries(revenue.revenueByChannel).map(([label, value]) => ({ label, value }));

  return {
    ...result,
    data: {
      metrics: [
        { label: "Gross revenue", value: formatCurrency(revenue.grossRevenue), detail: "Captured before refunds", status: "ok" },
        { label: "Net revenue", value: formatCurrency(revenue.netRevenue), detail: "After successful refunds", status: revenue.netRevenue >= 0 ? "ok" : "critical" },
        { label: "AOV", value: formatCurrency(revenue.averageOrderValue), detail: "Average paid order value", status: "ok" },
        { label: "Refunds", value: formatPercent(revenue.refundRate), detail: "Refunds over attempts", status: revenue.refundRate <= 0.05 ? "ok" : "warning" },
        { label: "Failed payments", value: formatPercent(revenue.failedPaymentRate), detail: "Failed payment attempts", status: revenue.failedPaymentRate <= 0.1 ? "ok" : "critical" },
        { label: "Payment health", value: formatPercent(revenue.paymentSuccessRate), detail: revenue.loyaltyImpact, status: statusFromScore(revenue.paymentSuccessRate * 100) }
      ],
      channelRevenue,
      revenueTrend: trendFromValue("Now", revenue.netRevenue),
      paymentHealth: [
        { label: "Success rate", status: statusFromScore(revenue.paymentSuccessRate * 100), detail: formatPercent(revenue.paymentSuccessRate) },
        { label: "Refund pressure", status: revenue.refundRate <= 0.05 ? "ok" : "warning", detail: formatPercent(revenue.refundRate) },
        { label: "AI attribution", status: "warning", detail: revenue.aiRecommendationConversionReadiness ?? "Awaiting attribution tags" }
      ]
    }
  };
}
