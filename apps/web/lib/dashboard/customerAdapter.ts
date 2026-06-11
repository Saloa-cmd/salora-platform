import { combineStatus, dashboardFetch, formatCurrency, formatPercent, requestIdsFrom, statusFromScore } from "./client";
import type { CustomerAnalytics, CustomerDashboardData, DashboardResult, LoyaltyAnalytics } from "./types";

export async function getCustomerDashboard(): Promise<DashboardResult<CustomerDashboardData>> {
  const [customers, loyalty] = await Promise.all([
    dashboardFetch<CustomerAnalytics>("/api/intelligence/customers"),
    dashboardFetch<LoyaltyAnalytics>("/api/intelligence/loyalty")
  ]);
  const status = combineStatus([customers, loyalty]);

  if (!customers.data) {
    return {
      status,
      requestIds: requestIdsFrom([customers, loyalty]),
      message: customers.message
    };
  }

  const customer = customers.data;
  const loyaltyData = loyalty.data;

  return {
    status,
    requestIds: requestIdsFrom([customers, loyalty]),
    data: {
      metrics: [
        { label: "Customer health", value: `${customer.customerHealthScore}/100`, detail: `${customer.customerCount} customer records`, status: statusFromScore(customer.customerHealthScore) },
        { label: "Loyalty engagement", value: loyaltyData ? `${loyaltyData.loyaltyEngagementScore}/100` : "Unavailable", detail: loyaltyData ? `${loyaltyData.activeLoyaltyAccounts} active accounts` : loyalty.message, status: loyaltyData ? statusFromScore(loyaltyData.loyaltyEngagementScore) : "empty" },
        { label: "Retention readiness", value: formatPercent(customer.repeatPurchaseReadiness), detail: `${customer.repeatCustomerCount} repeat customers`, status: statusFromScore(customer.repeatPurchaseReadiness * 100) },
        { label: "Churn risk", value: customer.churnRisk, detail: "Derived from repeat purchase readiness", status: customer.churnRisk === "high" ? "critical" : customer.churnRisk === "medium" ? "warning" : "ok" },
        { label: "Recommendation acceptance", value: "Ready", detail: customer.recommendationAcceptanceReadiness, status: "warning" },
        { label: "Average value", value: formatCurrency(customer.averageCustomerValue), detail: customer.lifetimeValueReadiness, status: "ok" }
      ],
      valueSegments: [
        { label: "Known", value: customer.customerCount },
        { label: "Repeat", value: customer.repeatCustomerCount },
        { label: "Loyalty", value: loyaltyData?.activeLoyaltyAccounts ?? 0 }
      ],
      retentionSignals: [
        { label: "Loyalty", status: loyaltyData ? statusFromScore(loyaltyData.loyaltyEngagementScore) : "empty", detail: loyaltyData?.rewardEligibilityReadiness ?? "Loyalty API unavailable" },
        { label: "Repeat purchase", status: statusFromScore(customer.repeatPurchaseReadiness * 100), detail: formatPercent(customer.repeatPurchaseReadiness) },
        { label: "Churn", status: customer.churnRisk === "high" ? "critical" : customer.churnRisk === "medium" ? "warning" : "ok", detail: customer.churnRisk }
      ]
    }
  };
}
