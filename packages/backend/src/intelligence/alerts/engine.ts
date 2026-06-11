import { generateKpis } from "../kpi/engine";

export type OperationalAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  type: "payment_failures" | "inventory_risk" | "ai_degradation" | "recommendation_degradation" | "whatsapp_failures" | "loyalty_anomaly";
  message: string;
  createdAt: string;
};

function alert(type: OperationalAlert["type"], severity: OperationalAlert["severity"], message: string): OperationalAlert {
  return { id: crypto.randomUUID(), type, severity, message, createdAt: new Date().toISOString() };
}

export function detectOperationalAlerts(): OperationalAlert[] {
  const kpis = generateKpis("daily");
  const alerts: OperationalAlert[] = [];

  if (kpis.revenue.failedPaymentRate > 0.1) alerts.push(alert("payment_failures", "critical", "Payment failure rate is above 10%."));
  if (kpis.inventory.inventoryRiskCount > 0) alerts.push(alert("inventory_risk", "warning", "Inventory reorder risk detected."));
  if (kpis.ai.aiEffectivenessScore < 75) alerts.push(alert("ai_degradation", "warning", "AI effectiveness score is degraded."));
  if (kpis.ai.averageEvaluationScore < 75) alerts.push(alert("recommendation_degradation", "warning", "AI recommendation quality may be degraded."));
  if (kpis.operations.operationsHealthScore < 80) alerts.push(alert("whatsapp_failures", "warning", "Operations health degraded; inspect channel/webhook metrics."));
  if (kpis.loyalty.netPoints < 0) alerts.push(alert("loyalty_anomaly", "critical", "Loyalty reversals exceed awards."));

  return alerts;
}
