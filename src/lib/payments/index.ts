import type { PaymentProvider } from "./types";
import { MockProvider } from "./mock";
import { StripeProvider } from "./stripe";

let provider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    const name = process.env.PAYMENT_PROVIDER ?? "mock";
    switch (name) {
      case "stripe":
        provider = new StripeProvider();
        break;
      case "mock":
        provider = new MockProvider();
        break;
      default:
        throw new Error(`PAYMENT_PROVIDER desconocido: "${name}" (soportados: mock, stripe)`);
    }
  }
  return provider;
}

export type { PaymentProvider } from "./types";
