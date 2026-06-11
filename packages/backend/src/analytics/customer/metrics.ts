import { listCustomers, listOrders } from "../../domains/services";
import { listPayments } from "../../domains/payments/service";

export function getCustomerIntelligenceSnapshot() {
  const customers = listCustomers();
  const orders = listOrders();
  const payments = listPayments().filter((payment) => payment.status === "PAID" || payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");
  const repeatCustomerIds = new Set(orders.map((order) => order.customerId).filter((customerId): customerId is string => Boolean(customerId)));
  const totalValue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const customerCount = Math.max(customers.length, 1);
  const repeatRate = repeatCustomerIds.size / customerCount;
  const averageCustomerValue = totalValue / customerCount;
  const churnRisk = repeatRate < 0.2 ? "high" : repeatRate < 0.5 ? "medium" : "low";
  const healthScore = Math.round(Math.min(100, 45 + repeatRate * 35 + Math.min(20, averageCustomerValue)));

  return {
    customerCount: customers.length,
    repeatCustomerCount: repeatCustomerIds.size,
    repeatPurchaseReadiness: repeatRate,
    averageCustomerValue,
    churnRisk,
    loyaltyEngagementReadiness: "tracked-through-loyalty-ledger",
    recommendationAcceptanceReadiness: "ready-for-attribution",
    lifetimeValueReadiness: "aggregate-ready",
    customerHealthScore: healthScore
  };
}
