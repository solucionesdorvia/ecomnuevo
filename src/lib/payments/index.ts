import type { PaymentProvider } from "./types";
import { MockProvider } from "./mock";
import { StripeProvider } from "./stripe";
import { MercadoPagoProvider } from "./mercadopago";
import { TransferProvider } from "./transfer";

const cache = new Map<string, PaymentProvider>();

function build(name: string): PaymentProvider {
  switch (name) {
    case "stripe":
      return new StripeProvider();
    case "mercadopago":
      return new MercadoPagoProvider();
    case "transferencia":
      return new TransferProvider();
    case "mock":
      return new MockProvider();
    default:
      throw new Error(
        `Proveedor de pago desconocido: "${name}" (soportados: mock, stripe, mercadopago, transferencia)`,
      );
  }
}

/** Proveedor por nombre — así cada pedido se confirma con el mismo con el que se inició. */
export function getProviderByName(name: string): PaymentProvider {
  let p = cache.get(name);
  if (!p) {
    p = build(name);
    cache.set(name, p);
  }
  return p;
}

/** Proveedor de TARJETA por defecto, según PAYMENT_PROVIDER (mock en dev). */
export function getPaymentProvider(): PaymentProvider {
  return getProviderByName(process.env.PAYMENT_PROVIDER ?? "mock");
}

export type { PaymentProvider } from "./types";
