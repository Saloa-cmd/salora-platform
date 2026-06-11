import { listOrders } from "../../domains/services";
import { listPayments, listRefunds } from "../../domains/payments/service";

export function getRevenueAnalyticsSnapshot() {
  const payments = listPayments();
  const refunds = listRefunds();
  const paidPayments = payments.filter((payment) => payment.status === "PAID" || payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");
  const grossRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const refundAmount = refunds.filter((refund) => refund.status === "SUCCEEDED").reduce((sum, refund) => sum + refund.amount, 0);
  const netRevenue = grossRevenue - refundAmount;
  const totalAttempts = payments.length || 1;
  const orders = listOrders();

  return {
    grossRevenue,
    netRevenue,
    averageOrderValue: paidPayments.length ? grossRevenue / paidPayments.length : 0,
    paymentSuccessRate: paidPayments.length / totalAttempts,
    refundRate: refunds.length / totalAttempts,
    failedPaymentRate: payments.filter((payment) => payment.status === "FAILED").length / totalAttempts,
    revenueByChannel: orders.reduce<Record<string, number>>((acc, order) => {
      const payment = paidPayments.find((item) => item.orderId === order.id);
      if (payment) acc.WEB = (acc.WEB ?? 0) + payment.amount;
      return acc;
    }, {}),
    loyaltyImpact: "points-awarded-after-paid-only",
    aiRecommendationConversionReadiness: "ready-for-attribution-tags"
  };
}
