import { withPrismaAuthContext, type PrismaAuthContext } from "@salora/backend/database/rls-context";
import type {
  AiAnalytics,
  CustomerAnalytics,
  InventoryAnalytics,
  KpiSnapshot,
  LoyaltyAnalytics,
  OperationsAnalytics,
  OperationsEnvelope,
  RevenueAnalytics
} from "@/lib/dashboard/types";

type DatabaseIntelligenceRow = {
  ordersTotal: number;
  paymentsTotal: number;
  successfulPayments: number;
  failedPayments: number;
  refundCount: number;
  grossRevenue: number;
  refundedAmount: number;
  revenueByChannel: Record<string, number> | null;
  customerCount: number;
  repeatCustomerCount: number;
  loyaltyAccounts: number;
  pointsAwarded: number;
  pointsReversed: number;
  queuedNotifications: number;
  ingredientCount: number;
  stockMovementCount: number;
  inventoryRiskCount: number;
  reorderRiskIngredients: string[] | null;
  aiRequestCount: number;
  aiRecommendationCount: number;
  aiAverageScore: number;
  aiAverageCost: number;
  aiSafetyBlocks: number;
  aiProviderUsage: Record<string, number> | null;
  whatsappEnabled: boolean | null;
};

export type DatabaseIntelligenceSnapshot = KpiSnapshot & {
  observed: {
    aiRecommendationCount: number;
    ingredientCount: number;
    stockMovementCount: number;
  };
};

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function customerChurnRisk(repeatRate: number, customerCount: number): CustomerAnalytics["churnRisk"] {
  if (customerCount === 0) return "high";
  return repeatRate < 0.2 ? "high" : repeatRate < 0.5 ? "medium" : "low";
}

/**
 * Produces the dashboard intelligence contract from PostgreSQL under the
 * authenticated operator's RLS context. It replaces process-memory metrics
 * at the HTTP boundary without removing the legacy in-memory domain helpers
 * used by isolated tests and non-persistent prototypes.
 */
export async function loadDatabaseIntelligence(
  authContext: PrismaAuthContext,
  period: KpiSnapshot["period"] = "daily"
): Promise<DatabaseIntelligenceSnapshot> {
  return withPrismaAuthContext(authContext, async (db) => {
    const rows = await db.$queryRaw<DatabaseIntelligenceRow[]>`
      select
        (select count(*)::int from public.cafe_orders) as "ordersTotal",
        (select count(*)::int from public.payments) as "paymentsTotal",
        (select count(*)::int from public.payments where status::text in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')) as "successfulPayments",
        (select count(*)::int from public.payments where status::text = 'FAILED') as "failedPayments",
        (select count(*)::int from public.refunds where status::text = 'SUCCEEDED') as "refundCount",
        (select coalesce(sum(amount), 0)::double precision from public.payments where status::text in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')) as "grossRevenue",
        (select coalesce(sum(amount), 0)::double precision from public.refunds where status::text = 'SUCCEEDED') as "refundedAmount",
        (select coalesce(jsonb_object_agg(channel, amount), '{}'::jsonb)
          from (
            select co.channel::text as channel, coalesce(sum(p.amount), 0)::double precision as amount
            from public.cafe_orders co
            join public.payments p on p.order_id = co.id
            where p.status::text in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')
            group by co.channel::text
          ) channel_revenue) as "revenueByChannel",
        (select count(*)::int from public.customer_profiles) as "customerCount",
        (select count(*)::int
          from (
            select customer_id
            from public.cafe_orders
            where customer_id is not null
            group by customer_id
            having count(*) > 1
          ) repeat_customers) as "repeatCustomerCount",
        (select count(*)::int from public.loyalty_accounts) as "loyaltyAccounts",
        (select coalesce(sum(case when points > 0 then points else 0 end), 0)::int from public.loyalty_ledger_entries) as "pointsAwarded",
        (select abs(coalesce(sum(case when points < 0 then points else 0 end), 0))::int from public.loyalty_ledger_entries) as "pointsReversed",
        (select count(*)::int from public.notifications where status::text = 'QUEUED') as "queuedNotifications",
        (select count(*)::int from public.ingredients) as "ingredientCount",
        (select count(*)::int from public.stock_movements) as "stockMovementCount",
        (select count(*)::int from public.ingredients where current_stock <= reorder_threshold) as "inventoryRiskCount",
        (select coalesce(array_agg(name order by name), array[]::text[])
          from (
            select name
            from public.ingredients
            where current_stock <= reorder_threshold
            order by name
            limit 10
          ) risks) as "reorderRiskIngredients",
        (select count(*)::int from public.ai_evaluation_records) as "aiRequestCount",
        (select count(*)::int from public.ai_recommendation_records) as "aiRecommendationCount",
        (select coalesce(avg(overall_score), 0)::double precision from public.ai_evaluation_records) as "aiAverageScore",
        (select coalesce(avg(estimated_cost), 0)::double precision from public.ai_evaluation_records) as "aiAverageCost",
        (select count(*)::int from public.ai_evaluation_records where safety_blocked = true) as "aiSafetyBlocks",
        (select coalesce(jsonb_object_agg(provider, count_value), '{}'::jsonb)
          from (
            select provider, count(*)::int as count_value
            from public.ai_evaluation_records
            group by provider
          ) provider_usage) as "aiProviderUsage",
        (select enabled
          from public.feature_flags
          where key = 'whatsapp_channel_enabled'
            and archived_at is null
            and deleted_at is null
          order by updated_at desc
          limit 1) as "whatsappEnabled"
    `;

    const row = rows[0] ?? {
      ordersTotal: 0,
      paymentsTotal: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundCount: 0,
      grossRevenue: 0,
      refundedAmount: 0,
      revenueByChannel: {},
      customerCount: 0,
      repeatCustomerCount: 0,
      loyaltyAccounts: 0,
      pointsAwarded: 0,
      pointsReversed: 0,
      queuedNotifications: 0,
      ingredientCount: 0,
      stockMovementCount: 0,
      inventoryRiskCount: 0,
      reorderRiskIngredients: [],
      aiRequestCount: 0,
      aiRecommendationCount: 0,
      aiAverageScore: 0,
      aiAverageCost: 0,
      aiSafetyBlocks: 0,
      aiProviderUsage: {},
      whatsappEnabled: false
    };

    const netRevenue = row.grossRevenue - row.refundedAmount;
    const paymentSuccessRate = ratio(row.successfulPayments, row.paymentsTotal);
    const refundRate = ratio(row.refundCount, row.paymentsTotal);
    const failedPaymentRate = ratio(row.failedPayments, row.paymentsTotal);

    const revenue: RevenueAnalytics = {
      grossRevenue: row.grossRevenue,
      netRevenue,
      averageOrderValue: row.successfulPayments > 0 ? row.grossRevenue / row.successfulPayments : 0,
      paymentSuccessRate,
      refundRate,
      failedPaymentRate,
      revenueByChannel: row.revenueByChannel ?? {},
      loyaltyImpact: "postgresql-loyalty-ledger-observed",
      aiRecommendationConversionReadiness: row.aiRecommendationCount > 0 ? "recommendations-observed" : "awaiting-recommendation-history"
    };

    const repeatRate = ratio(row.repeatCustomerCount, row.customerCount);
    const averageCustomerValue = row.customerCount > 0 ? row.grossRevenue / row.customerCount : 0;
    const customers: CustomerAnalytics = {
      customerCount: row.customerCount,
      repeatCustomerCount: row.repeatCustomerCount,
      repeatPurchaseReadiness: repeatRate,
      averageCustomerValue,
      churnRisk: customerChurnRisk(repeatRate, row.customerCount),
      loyaltyEngagementReadiness: row.loyaltyAccounts > 0 ? "loyalty-accounts-observed" : "awaiting-loyalty-accounts",
      recommendationAcceptanceReadiness: row.aiRecommendationCount > 0 ? "recommendations-observed" : "awaiting-attribution",
      lifetimeValueReadiness: row.customerCount > 0 ? "aggregate-ready" : "awaiting-customer-history",
      customerHealthScore: row.customerCount > 0 ? clampScore(45 + repeatRate * 35 + Math.min(20, averageCustomerValue)) : 0
    };

    const netPoints = row.pointsAwarded - row.pointsReversed;
    const loyalty: LoyaltyAnalytics = {
      activeLoyaltyAccounts: row.loyaltyAccounts,
      pointsAwarded: row.pointsAwarded,
      pointsReversed: row.pointsReversed,
      netPoints,
      rewardEligibilityReadiness: row.loyaltyAccounts > 0 ? "ready" : "awaiting-loyalty-accounts",
      loyaltyEngagementScore: row.loyaltyAccounts > 0 ? clampScore(row.loyaltyAccounts * 10 + Math.max(0, netPoints)) : 0
    };

    const costEfficiencyScore = clampScore(100 - row.aiAverageCost * 1000);
    const ai: AiAnalytics = {
      requestCount: row.aiRequestCount,
      providerUsage: row.aiProviderUsage ?? {},
      averageEvaluationScore: Math.round(row.aiAverageScore),
      safetyBlockCount: row.aiSafetyBlocks,
      averageEstimatedCost: row.aiAverageCost,
      costEfficiencyScore,
      recommendationEffectivenessReadiness: row.aiRecommendationCount > 0 ? "recommendations-observed" : "awaiting-conversion-attribution",
      aiEffectivenessScore: row.aiRequestCount > 0
        ? clampScore((row.aiAverageScore + costEfficiencyScore + (row.aiSafetyBlocks === 0 ? 100 : 70)) / 3)
        : 0
    };

    const inventoryDataObserved = row.ingredientCount > 0 || row.stockMovementCount > 0;
    const operations: OperationsAnalytics = {
      ordersTotal: row.ordersTotal,
      paymentsTotal: row.paymentsTotal,
      failedPayments: row.failedPayments,
      queuedNotifications: row.queuedNotifications,
      ordersDashboardReady: true,
      paymentsDashboardReady: true,
      inventoryDashboardReady: inventoryDataObserved,
      customerDashboardReady: true,
      aiDashboardReady: true,
      whatsappDashboardReady: row.whatsappEnabled === true,
      operationsHealthScore: clampScore(100 - row.failedPayments * 10 - row.queuedNotifications * 2)
    };

    const inventory: InventoryAnalytics = {
      movementCount: row.stockMovementCount,
      inventoryRiskCount: row.inventoryRiskCount,
      reorderRiskIngredients: row.reorderRiskIngredients ?? [],
      inventoryForecastingReadiness: !inventoryDataObserved
        ? "awaiting-inventory-data"
        : row.stockMovementCount > 0
          ? "stock-and-movement-history-observed"
          : "stock-level-observed; awaiting-movement-history",
      inventoryHealthScore: row.ingredientCount > 0 ? clampScore(100 - row.inventoryRiskCount * 15) : 0
    };

    const revenueHealthScore = row.paymentsTotal > 0
      ? clampScore(paymentSuccessRate * 50 + (refundRate <= 0.05 ? 25 : 10) + (netRevenue >= 0 ? 25 : 0))
      : 0;

    return {
      period,
      generatedAt: new Date().toISOString(),
      executive: {
        revenueHealthScore,
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
      inventory,
      observed: {
        aiRecommendationCount: row.aiRecommendationCount,
        ingredientCount: row.ingredientCount,
        stockMovementCount: row.stockMovementCount
      }
    };
  });
}

export function databaseOperationsEnvelope(snapshot: DatabaseIntelligenceSnapshot): OperationsEnvelope {
  const createdAt = snapshot.generatedAt;
  const alerts: OperationsEnvelope["alerts"] = [];

  if (snapshot.operations.failedPayments > 0) {
    alerts.push({
      id: "failed-payments",
      severity: "warning",
      type: "FAILED_PAYMENTS",
      message: `${snapshot.operations.failedPayments} failed payment attempts require review.`,
      createdAt
    });
  }
  if (snapshot.operations.queuedNotifications > 0) {
    alerts.push({
      id: "queued-notifications",
      severity: "warning",
      type: "QUEUED_NOTIFICATIONS",
      message: `${snapshot.operations.queuedNotifications} notifications remain queued.`,
      createdAt
    });
  }
  if (snapshot.inventory.inventoryRiskCount > 0) {
    alerts.push({
      id: "inventory-risk",
      severity: "warning",
      type: "INVENTORY_REORDER_RISK",
      message: `${snapshot.inventory.inventoryRiskCount} ingredients are at or below reorder threshold.`,
      createdAt
    });
  }
  if (snapshot.observed.ingredientCount === 0 && snapshot.observed.stockMovementCount === 0) {
    alerts.push({
      id: "inventory-data-empty",
      severity: "info",
      type: "INVENTORY_DATA_EMPTY",
      message: "No persisted ingredient stock or movement data is available for inventory scoring.",
      createdAt
    });
  }

  return {
    operations: snapshot.operations,
    inventory: snapshot.inventory,
    alerts,
    forecasting: {
      salesForecasting: snapshot.operations.ordersTotal >= 20 ? "history-available" : "needs-more-order-history",
      inventoryForecasting: snapshot.observed.stockMovementCount > 0
        ? "movement-history-available"
        : snapshot.observed.ingredientCount > 0
          ? "stock-level-ready; movement-history-needed"
          : "needs-inventory-data",
      loyaltyForecasting: snapshot.loyalty.activeLoyaltyAccounts > 0 ? "loyalty-history-available" : "needs-loyalty-history",
      aiDemandForecasting: snapshot.ai.requestCount >= 20 ? "evaluation-history-available" : "needs-more-ai-history",
      requiredNextData: [
        ...(snapshot.operations.ordersTotal < 20 ? ["more order history"] : []),
        ...(snapshot.observed.ingredientCount === 0 && snapshot.observed.stockMovementCount === 0
          ? ["ingredient stock and movement records"]
          : snapshot.observed.stockMovementCount === 0
            ? ["inventory movement history"]
            : []),
        ...(snapshot.loyalty.activeLoyaltyAccounts === 0 ? ["loyalty account activity"] : []),
        ...(snapshot.ai.requestCount < 20 ? ["more AI evaluation records"] : [])
      ]
    }
  };
}
