import { listEvaluationMetadata } from "../../ai/evaluation/v2/store";

export function getAiIntelligenceSnapshot() {
  const evaluations = listEvaluationMetadata();
  const count = evaluations.length || 1;
  const averageScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score.overall, 0) / count;
  const averageCost = evaluations.reduce((sum, evaluation) => sum + evaluation.estimatedCost, 0) / count;
  const safetyBlocks = evaluations.filter((evaluation) => evaluation.safetyBlocked).length;
  const providerUsage = evaluations.reduce<Record<string, number>>((acc, evaluation) => {
    acc[evaluation.provider] = (acc[evaluation.provider] ?? 0) + 1;
    return acc;
  }, {});
  const costEfficiencyScore = Math.max(0, Math.round(100 - averageCost * 1000));

  return {
    requestCount: evaluations.length,
    providerUsage,
    averageEvaluationScore: Math.round(averageScore),
    safetyBlockCount: safetyBlocks,
    averageEstimatedCost: averageCost,
    costEfficiencyScore,
    recommendationEffectivenessReadiness: "ready-for-conversion-attribution",
    aiEffectivenessScore: Math.round((averageScore + costEfficiencyScore + (safetyBlocks === 0 ? 100 : 70)) / 3)
  };
}
