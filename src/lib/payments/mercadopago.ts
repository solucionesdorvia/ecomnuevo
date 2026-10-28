import type { CheckoutInput, CheckoutSession, PaymentConfirmation, PaymentProvider } from "./types";

// Pasarela de TARJETA vía Mercado Pago (Checkout Pro). Scaffold listo para
// enchufar: el día que haya cuenta de comercio aprobada se instala el SDK
// (npm i mercadopago) y se cargan MP_ACCESS_TOKEN + NEXT_PUBLIC_APP_URL.
// Sin token tira un error claro — nunca cobra "a medias".
//
// Tipamos sólo lo que usamos del SDK para no depender de sus tipos ni romper
// el build mientras la dependencia no esté instalada (import dinámico con
// specifier variable + magic comments, igual que el validador de AFIP).
type MPModule = {
  MercadoPagoConfig: new (opts: { accessToken: string }) => object;
  Preference: new (client: object) => {
    create(args: { body: Record<string, unknown> }): Promise<{
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    }>;
  };
};

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";

  private token(): string {
    const t = process.env.MP_ACCESS_TOKEN;
    if (!t) {
      throw new Error(
        "Falta MP_ACCESS_TOKEN — configurá las credenciales de Mercado Pago, " +
          "o usá PAYMENT_PROVIDER=mock mientras tanto.",
      );
    }
    return t;
  }

  private async load(): Promise<MPModule> {
    const spec: string = "mercadopago";
    try {
      return (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ spec)) as unknown as MPModule;
    } catch {
      throw new Error("Falta la dependencia mercadopago — instalala con: npm i mercadopago");
    }
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const mp = await this.load();
    const client = new mp.MercadoPagoConfig({ accessToken: this.token() });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const res = await new mp.Preference(client).create({
      body: {
        items: [
          {
            id: String(input.orderNumber),
            title: `Traelo — pedido #${input.orderNumber}`,
            quantity: 1,
            currency_id: "ARS",
            // MP cobra en ARS: convertir USD→ARS (misma cotización que transferencia)
            // antes de salir a producción. Punto de enganche marcado a propósito.
            unit_price: input.totalUsd,
          },
        ],
        payer: { email: input.customerEmail },
        external_reference: input.orderId,
        back_urls: {
          success: `${base}${input.successUrl}`,
          failure: `${base}${input.cancelUrl}`,
          pending: `${base}${input.successUrl}`,
        },
        auto_return: "approved",
      },
    });
    const redirectUrl = res.init_point ?? res.sandbox_init_point ?? "";
    if (!redirectUrl) throw new Error("Mercado Pago no devolvió init_point.");
    return { redirectUrl, externalId: res.id ?? "" };
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmation> {
    // Enganche de producción: confirmar por WEBHOOK de 'payment' (no por la
    // preferencia). Hasta implementarlo no auto-aprobamos, para no dar por
    // pagado un pedido que no lo está.
    return {
      status: "rejected",
      externalId,
      reason: "Confirmación de Mercado Pago pendiente de implementar (webhook de pagos).",
    };
  }

  async refund(): Promise<void> {
    throw new Error("Refund de Mercado Pago no implementado todavía.");
  }
}
