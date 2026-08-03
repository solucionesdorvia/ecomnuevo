import Stripe from "stripe";
import type { CheckoutInput, CheckoutSession, PaymentConfirmation, PaymentProvider } from "./types";

// Stripe en test mode. Requiere STRIPE_SECRET_KEY en el entorno.

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  private stripe: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Falta STRIPE_SECRET_KEY para usar el proveedor Stripe.");
    this.stripe = new Stripe(key);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    // Stripe exige URLs absolutas; las relativas se resuelven contra la app
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const abs = (u: string) => (u.startsWith("/") ? `${base}${u}` : u);
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      currency: "usd",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(input.totalUsd * 100),
            product_data: { name: `Pedido #${input.orderNumber} — Ecomex Market` },
          },
          quantity: 1,
        },
      ],
      customer_email: input.customerEmail,
      success_url: abs(input.successUrl),
      cancel_url: abs(input.cancelUrl),
      metadata: { orderId: input.orderId },
    });
    if (!session.url) throw new Error("Stripe no devolvió URL de checkout.");
    return { redirectUrl: session.url, externalId: session.id };
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmation> {
    const session = await this.stripe.checkout.sessions.retrieve(externalId);
    if (session.payment_status === "paid") return { status: "approved", externalId };
    return { status: "rejected", externalId, reason: `Estado de pago en Stripe: ${session.payment_status}` };
  }

  async refund(externalId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(externalId);
    const paymentIntent = session.payment_intent;
    if (typeof paymentIntent !== "string") throw new Error("No hay payment_intent para reembolsar.");
    await this.stripe.refunds.create({ payment_intent: paymentIntent });
  }
}
