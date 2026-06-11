import { getRevenueAnalyticsSnapshot } from "../../analytics/revenue/metrics";
import { getCustomerIntelligenceSnapshot } from "../../analytics/customer/metrics";
import { getLoyaltyIntelligenceSnapshot } from "../../analytics/loyalty/metrics";
import { getAiIntelligenceSnapshot } from "../../analytics/ai/metrics";
import { getOperationsSnapshot } from "../../analytics/operations/metrics";
import { getInventoryIntelligenceSnapshot } from "../../analytics/inventory/metrics";

export type KpiPeriod = "daily" | "weekly" | "monthly";

export function generateKpis(period: KpiPeriod = "daily") {
  const revenue = getRevenueAnalyticsSnapshot();
  const customers = getCustomerIntelligenceSnapshot();
  const loyalty = getLoyaltyIntelligenceSnapshot();
  const ai = getAiIntelligenceSnapshot();
  const operations = getOperationsSnapshot();
  const inventory = getInventoryIntelligenceSnapshot();

  return {
    period,
    generatedAt: new Date().toISOString(),
    executive: {
      revenueHealthScore: Math.round(Math.min(100, revenue.paymentSuccessRate * 50 + (revenue.refundRate <= 0.05 ? 25 : 10) + (revenue.netRevenue >= 0 ? 25 : 0))),
      customerHealthScore: customers.customerHealthScore,
      loyaltyEngagementScore: loyalty.loyaltyEngagementScore,
      aiEffectivenessScore: ai.aiEffectivenessScore,
      operationsHealthScore: operations.operationsHealthScore,
      inventoryHealthScore: inventory.inventoryHealthScore
    },
    revenue,
    customers,
    loyalty,
    ai,
    operations,
    inventory
  };
}

export function generateExecutiveReport() {
  return {
    daily: generateKpis("daily"),
    weekly: generateKpis("weekly"),
    monthly: generateKpis("monthly")
  };
}
