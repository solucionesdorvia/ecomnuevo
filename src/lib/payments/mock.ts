import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { CheckoutInput, CheckoutSession, PaymentConfirmation, PaymentProvider } from "./types";

// Procesador simulado para desarrollo: redirige a una pantalla local de pago
// (/pago/mock) donde se aprueba o rechaza a mano. No requiere credenciales.
// El estado vive en la tabla MockPayment: el dev server corre varios workers
// y cualquier estado en memoria (aun colgado de globalThis) no se comparte.

export class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const externalId = `mock_${randomBytes(8).toString("hex")}`;
    await db.mockPayment.create({ data: { externalId, orderId: input.orderId } });
    const params = new URLSearchParams({
      sid: externalId,
      oid: input.orderId,
      total: input.totalUsd.toFixed(2),
      order: String(input.orderNumber),
      cancel: input.cancelUrl,
    });
    return { redirectUrl: `/pago/mock?${params.toString()}`, externalId };
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmation> {
    const s = await db.mockPayment.findUnique({ where: { externalId } });
    if (s?.status === "approved") return { status: "approved", externalId };
    return {
      status: "rejected",
      externalId,
      reason: s ? "El pago fue rechazado en la pantalla de prueba." : "Sesión de pago inexistente o vencida.",
    };
  }

  async refund(externalId: string): Promise<void> {
    await db.mockPayment.updateMany({ where: { externalId }, data: { status: "refunded" } });
  }

  /** Usado solo por la pantalla /pago/mock para resolver el pago de prueba. */
  static async resolve(externalId: string, approved: boolean): Promise<void> {
    await db.mockPayment.updateMany({
      where: { externalId },
      data: { status: approved ? "approved" : "rejected" },
    });
  }
}
