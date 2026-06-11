export type DashboardStatus = "ok" | "warning" | "critical" | "empty" | "unauthorized" | "error";

export type DashboardMetric = {
  label: string;
  value: string;
  detail?: string;
  change?: string;
  status?: DashboardStatus;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  createdAt?: string;
};

export type RuntimeStatus = {
  label: string;
  status: DashboardStatus;
  detail: string;
  checkedAt?: string;
};

export type DashboardResult<T> = {
  status: DashboardStatus;
  requestIds: string[];
  data?: T;
  message?: string;
};

export type RevenueAnalytics = {
  grossRevenue: number;
  netRevenue: number;
  averageOrderValue: number;
  paymentSuccessRate: number;
  refundRate: number;
  failedPaymentRate: number;
  revenueByChannel: Record<string, number>;
  loyaltyImpact?: string;
  aiRecommendationConversionReadiness?: string;
};

export type OperationsAnalytics = {
  ordersTotal: number;
  paymentsTotal: number;
  failedPayments: number;
  queuedNotifications: number;
  operationsHealthScore: number;
  ordersDashboardReady: boolean;
  paymentsDashboardReady: boolean;
  inventoryDashboardReady: boolean;
  customerDashboardReady: boolean;
  aiDashboardReady: boolean;
  whatsappDashboardReady: boolean;
};

export type InventoryAnalytics = {
  movementCount: number;
  inventoryRiskCount: number;
  reorderRiskIngredients: string[];
  inventoryForecastingReadiness: string;
  inventoryHealthScore: number;
};

export type AiAnalytics = {
  requestCount: number;
  providerUsage: Record<string, number>;
  averageEvaluationScore: number;
  safetyBlockCount: number;
  averageEstimatedCost: number;
  costEfficiencyScore: number;
  recommendationEffectivenessReadiness: string;
  aiEffectivenessScore: number;
};

export type CustomerAnalytics = {
  customerCount: number;
  repeatCustomerCount: number;
  repeatPurchaseReadiness: number;
  averageCustomerValue: number;
  churnRisk: "low" | "medium" | "high";
  loyaltyEngagementReadiness: string;
  recommendationAcceptanceReadiness: string;
  lifetimeValueReadiness: string;
  customerHealthScore: number;
};

export type LoyaltyAnalytics = {
  activeLoyaltyAccounts: number;
  pointsAwarded: number;
  pointsReversed: number;
  netPoints: number;
  rewardEligibilityReadiness: string;
  loyaltyEngagementScore: number;
};

export type KpiSnapshot = {
  period: "daily" | "weekly" | "monthly";
  generatedAt: string;
  executive: {
    revenueHealthScore: number;
    customerHealthScore: number;
    loyaltyEngagementScore: number;
    aiEffectivenessScore: number;
    operationsHealthScore: number;
    inventoryHealthScore: number;
  };
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  loyalty: LoyaltyAnalytics;
  ai: AiAnalytics;
  operations: OperationsAnalytics;
  inventory: InventoryAnalytics;
};

export type OperationsEnvelope = {
  operations: OperationsAnalytics;
  inventory: InventoryAnalytics;
  alerts: Array<{
    id: string;
    severity: "info" | "warning" | "critical";
    type: string;
    message: string;
    createdAt: string;
  }>;
  forecasting: {
    salesForecasting: string;
    inventoryForecasting: string;
    loyaltyForecasting: string;
    aiDemandForecasting: string;
    requiredNextData: string[];
  };
};

export type ExecutiveDashboardData = {
  generatedAt?: string;
  metrics: DashboardMetric[];
  revenueTrend: TrendPoint[];
  runtime: RuntimeStatus[];
  alerts: DashboardAlert[];
};

export type RevenueDashboardData = {
  metrics: DashboardMetric[];
  channelRevenue: TrendPoint[];
  revenueTrend: TrendPoint[];
  paymentHealth: RuntimeStatus[];
};

export type OperationsDashboardData = {
  metrics: DashboardMetric[];
  queueHealth: RuntimeStatus[];
  inventoryAlerts: DashboardAlert[];
  runtimeAlerts: DashboardAlert[];
  systemHealth: RuntimeStatus[];
};

export type AiDashboardData = {
  metrics: DashboardMetric[];
  providerUsage: TrendPoint[];
  modelHealth: RuntimeStatus[];
  recommendationPerformance: RuntimeStatus[];
};

export type CustomerDashboardData = {
  metrics: DashboardMetric[];
  valueSegments: TrendPoint[];
  retentionSignals: RuntimeStatus[];
};

export type WhatsappDashboardData = {
  metrics: DashboardMetric[];
  channelHealth: RuntimeStatus[];
  assistance: RuntimeStatus[];
  emptyStates: DashboardAlert[];
};
