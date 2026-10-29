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

/** ¿Se ofrece el pago con tarjeta? El mock aprueba sin cobrar: en producción
 *  solo se habilita con ALLOW_MOCK_PAYMENTS=1 (si no, cualquiera "pagaría"). */
export function mockPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "1";
}

export function cardPaymentsEnabled(): boolean {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name === "transferencia") return false;
  if (name === "mock") return mockPaymentsAllowed();
  return true;
}

export type { PaymentProvider } from "./types";
