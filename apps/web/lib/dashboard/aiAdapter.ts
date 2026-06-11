import { dashboardFetch, formatCurrency, statusFromScore } from "./client";
import type { AiAnalytics, AiDashboardData, DashboardResult } from "./types";

export async function getAiDashboard(): Promise<DashboardResult<AiDashboardData>> {
  const result = await dashboardFetch<AiAnalytics>("/api/intelligence/ai");
  if (!result.data) return { ...result, data: undefined };

  const ai = result.data;
  const providerUsage = Object.entries(ai.providerUsage).map(([label, value]) => ({ label, value }));

  return {
    ...result,
    data: {
      metrics: [
        { label: "Provider usage", value: String(ai.requestCount), detail: "Total AI evaluations", status: ai.requestCount ? "ok" : "empty" },
        { label: "AI cost estimate", value: formatCurrency(ai.averageEstimatedCost), detail: "Average estimated cost", status: statusFromScore(ai.costEfficiencyScore) },
        { label: "Latency", value: "Unavailable", detail: "Latency metric not exposed by current AI API", status: "empty" },
        { label: "Fallback rate", value: "Unavailable", detail: "Fallback metric not exposed by current AI API", status: "empty" },
        { label: "Evaluation score", value: `${ai.averageEvaluationScore}/100`, detail: "Average evaluation score", status: statusFromScore(ai.averageEvaluationScore) },
        { label: "Safety blocks", value: String(ai.safetyBlockCount), detail: "Safety-filtered generations", status: ai.safetyBlockCount ? "warning" : "ok" }
      ],
      providerUsage,
      modelHealth: [
        { label: "Effectiveness", status: statusFromScore(ai.aiEffectivenessScore), detail: `${ai.aiEffectivenessScore}/100` },
        { label: "Cost efficiency", status: statusFromScore(ai.costEfficiencyScore), detail: `${ai.costEfficiencyScore}/100` },
        { label: "Safety", status: ai.safetyBlockCount ? "warning" : "ok", detail: `${ai.safetyBlockCount} blocks` }
      ],
      recommendationPerformance: [
        { label: "Recommendation readiness", status: "warning", detail: ai.recommendationEffectivenessReadiness },
        { label: "Attribution", status: "empty", detail: "Conversion attribution tags are required for true acceptance metrics" }
      ]
    }
  };
}
