export function redactPaymentError(error: unknown): string {
  if (!(error instanceof Error)) return "Payment operation failed.";
  return error.message.replace(/sk_(live|test)_[A-Za-z0-9]+/g, "[redacted-stripe-key]").replace(/whsec_[A-Za-z0-9]+/g, "[redacted-webhook-secret]");
}

export function assertNoCardData(input: unknown): void {
  const text = JSON.stringify(input).toLowerCase();
  for (const forbidden of ["card_number", "cvc", "cvv", "pan", "expiry_month", "expiry_year"]) {
    if (text.includes(forbidden)) {
      throw new Error("PCI-sensitive card data is not accepted by SALORA.");
    }
  }
}

export function paymentRateLimitKey(customerId?: string, orderId?: string): string {
  return customerId ?? orderId ?? "anonymous-payment";
}
