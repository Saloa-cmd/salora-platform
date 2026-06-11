import { generateKpis } from "../kpi/engine";

export function getForecastingReadiness() {
  const kpis = generateKpis("daily");
  return {
    salesForecasting: kpis.revenue.grossRevenue >= 0 ? "ready-for-history-collection" : "blocked",
    inventoryForecasting: kpis.inventory.inventoryForecastingReadiness,
    loyaltyForecasting: "points-ledger-ready",
    aiDemandForecasting: kpis.ai.requestCount >= 0 ? "evaluation-history-ready" : "blocked",
    requiredNextData: ["daily revenue snapshots", "product-level attribution", "channel-level conversion", "inventory depletion history"]
  };
}
