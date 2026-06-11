import { listPayments, listRefunds } from "../../domains/payments/service";

export function buildSafeRevenueContext(customerId?: string) {
  const payments = listPayments().filter((payment) => !customerId || payment.customerId === customerId);
  const refunds = listRefunds().filter((refund) => payments.some((payment) => payment.id === refund.paymentId));
  const paid = payments.filter((payment) => payment.status === "PAID" || payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");
  const gross = paid.reduce((sum, payment) => sum + payment.amount, 0);
  const refunded = refunds.filter((refund) => refund.status === "SUCCEEDED").reduce((sum, refund) => sum + refund.amount, 0);

  return {
    paidOrderCount: paid.length,
    customerValueBand: gross - refunded > 50 ? "high" : gross - refunded > 15 ? "medium" : "new",
    refundHistoryBand: refunded > 0 ? "has_refunds" : "no_refunds",
    allowedForAi: true,
    excludes: ["card_data", "provider_payloads", "payment_secrets", "full_pii", "audit_logs"]
  };
}
