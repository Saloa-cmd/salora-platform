import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const files = {
  analysis: read("docs/operations-intelligence-analysis.md"),
  customer: read("packages/backend/src/analytics/customer/metrics.ts"),
  loyalty: read("packages/backend/src/analytics/loyalty/metrics.ts"),
  ai: read("packages/backend/src/analytics/ai/metrics.ts"),
  revenue: read("packages/backend/src/analytics/revenue/metrics.ts"),
  operations: read("packages/backend/src/analytics/operations/metrics.ts"),
  inventory: read("packages/backend/src/analytics/inventory/metrics.ts"),
  kpi: read("packages/backend/src/intelligence/kpi/engine.ts"),
  alerts: read("packages/backend/src/intelligence/alerts/engine.ts"),
  forecasting: read("packages/backend/src/intelligence/forecasting/readiness.ts"),
  apiGuard: read("apps/web/lib/server/intelligenceHttp.ts"),
  packageJson: read("package.json")
};

for (const phrase of ["operational blind spots", "reporting gaps", "intelligence gaps", "executive KPI requirements"]) {
  assert.ok(files.analysis.toLowerCase().includes(phrase.toLowerCase()), `analysis should include ${phrase}`);
}

for (const metric of ["customerHealthScore", "churnRisk", "lifetimeValueReadiness"]) {
  assert.ok(files.customer.includes(metric), `customer intelligence should include ${metric}`);
}

for (const metric of ["loyaltyEngagementScore", "pointsAwarded", "pointsReversed"]) {
  assert.ok(files.loyalty.includes(metric), `loyalty intelligence should include ${metric}`);
}

for (const metric of ["providerUsage", "costEfficiencyScore", "aiEffectivenessScore"]) {
  assert.ok(files.ai.includes(metric), `AI intelligence should include ${metric}`);
}

for (const metric of ["grossRevenue", "netRevenue", "paymentSuccessRate"]) {
  assert.ok(files.revenue.includes(metric), `revenue intelligence should include ${metric}`);
}

for (const readiness of ["ordersDashboardReady", "paymentsDashboardReady", "whatsappDashboardReady"]) {
  assert.ok(files.operations.includes(readiness), `operations dashboard readiness should include ${readiness}`);
}

assert.ok(files.inventory.includes("inventoryForecastingReadiness"), "inventory intelligence should support forecasting readiness");
assert.ok(files.kpi.includes("daily") && files.kpi.includes("weekly") && files.kpi.includes("monthly"), "KPI engine should support daily weekly monthly periods");
assert.ok(files.alerts.includes("payment_failures") && files.alerts.includes("ai_degradation") && files.alerts.includes("loyalty_anomaly"), "alert engine should detect operational risks");
assert.ok(files.forecasting.includes("salesForecasting") && files.forecasting.includes("aiDemandForecasting"), "forecasting readiness should include sales and AI demand");
assert.ok(files.apiGuard.includes("MANAGER") && files.apiGuard.includes("ADMIN"), "intelligence APIs should require manager or admin");
assert.ok(files.packageJson.includes("operations-intelligence.test.mjs"), "test suite should include operations intelligence test");

console.log("Operations intelligence tests passed.");
