import { listInventoryMovements } from "../../domains/services";

export function getInventoryIntelligenceSnapshot() {
  const movements = listInventoryMovements();
  const riskItems = movements.filter((movement) => movement.quantity <= movement.reorderThreshold);
  return {
    movementCount: movements.length,
    inventoryRiskCount: riskItems.length,
    reorderRiskIngredients: riskItems.map((movement) => movement.ingredientName).slice(0, 10),
    inventoryForecastingReadiness: "movement-history-ready",
    inventoryHealthScore: Math.max(0, 100 - riskItems.length * 15)
  };
}
