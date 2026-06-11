import { getPaymentEnv } from "./config";
import { MockPaymentProvider } from "./mock/provider";
import { StripePaymentProvider } from "./stripe/provider";
import type { PaymentProvider, PaymentProviderName } from "./types";

const providers = new Map<PaymentProviderName, PaymentProvider>([
  ["mock", new MockPaymentProvider()],
  ["stripe", new StripePaymentProvider()]
]);

export function getPaymentProvider(name: PaymentProviderName = getPaymentEnv().PAYMENT_PROVIDER): PaymentProvider {
  return providers.get(name) ?? providers.get("mock")!;
}

export function listPaymentProviders(): PaymentProviderName[] {
  return [...providers.keys()];
}
