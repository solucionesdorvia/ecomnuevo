// Capa abstracta de pagos. El resto del código solo conoce esta interfaz;
// cambiar de procesador (Stripe → Mercado Pago u otro) es agregar una
// implementación y cambiar PAYMENT_PROVIDER en el entorno.

export type CheckoutInput = {
  orderId: string;
  orderNumber: number;
  totalUsd: number;
  customerEmail: string;
  /** Ruta o URL a la que volver tras el pago (los providers externos la absolutizan) */
  successUrl: string;
  /** Ruta o URL a la que volver si se cancela */
  cancelUrl: string;
};

export type CheckoutSession = {
  /** URL a la que redirigir al cliente para pagar */
  redirectUrl: string;
  /** Id externo del checkout/pago en el procesador */
  externalId: string;
};

export type PaymentConfirmation =
  | { status: "approved"; externalId: string }
  | { status: "rejected"; externalId: string; reason: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** Verifica contra el procesador el estado real del pago. */
  confirmPayment(externalId: string): Promise<PaymentConfirmation>;
  refund(externalId: string): Promise<void>;
}
