import type { CheckoutInput, CheckoutSession, PaymentConfirmation, PaymentProvider } from "./types";

// Cobro por transferencia bancaria. No hay procesador externo: el pedido queda
// en PENDIENTE y el operador confirma a mano, desde el panel, que la plata
// entró. createCheckout solo lleva al cliente a la página con los datos de la
// cuenta y el código de referencia.
export class TransferProvider implements PaymentProvider {
  readonly name = "transferencia";

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return {
      redirectUrl: `/checkout/transferencia?pedido=${input.orderId}`,
      externalId: `transfer_${input.orderId}`,
    };
  }

  // La verificación real la hace el operador (mira el banco / el comprobante)
  // antes de disparar la confirmación. Para cuando se llega acá, ese chequeo
  // humano ya ocurrió, así que se aprueba.
  async confirmPayment(externalId: string): Promise<PaymentConfirmation> {
    return { status: "approved", externalId };
  }

  async refund(): Promise<void> {
    throw new Error("La devolución de una transferencia se gestiona a mano.");
  }
}
