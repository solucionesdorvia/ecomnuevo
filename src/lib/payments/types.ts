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
  /** Ruta o URL si el pago es rechazado (si falta, se usa cancelUrl) */
  errorUrl?: string;
  /** Datos del comprador: los piden las pasarelas locales (Getnet). */
  customer?: CheckoutCustomer;
};

export type CheckoutCustomer = {
  name: string;
  docType: "DNI" | "CUIT";
  docNumber: string;
  address: {
    street: string;
    apartment?: string | null;
    city: string;
    province: string;
    zipCode: string;
    phone: string;
  };
};

export type CheckoutSession = {
  /** URL a la que redirigir al cliente para pagar */
  redirectUrl: string;
  /** Id externo del checkout/pago en el procesador */
  externalId: string;
};

export type PaymentConfirmation =
  | { status: "approved"; externalId: string }
  | { status: "rejected"; externalId: string; reason: string }
  /** El procesador todavía no informó el resultado (p. ej. el webhook no llegó). */
  | { status: "pending"; externalId: string; reason: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** Verifica contra el procesador el estado real del pago. */
  confirmPayment(externalId: string): Promise<PaymentConfirmation>;
  refund(externalId: string): Promise<void>;
}
