import "server-only";
import type { DocType, LogisticState } from "@prisma/client";
import { db } from "@/lib/db";
import { checkCourierLimits } from "@/lib/courier";
import { isValidTransition } from "@/lib/estados";
import { getMailer } from "@/lib/mailer";
import { paymentConfirmedMail, stateChangedMail } from "@/lib/mailer/templates";
import type { Cart } from "@/lib/cart";

export class OrderError extends Error {}

/**
 * Crea el pedido (PENDIENTE de pago) desde el carrito. Re-valida los topes
 * courier en el servidor: nunca se confía en lo que calculó el cliente.
 */
export async function createOrderFromCart(args: {
  userId: string;
  addressId: string;
  docType: DocType;
  docNumber: string;
  cart: Cart;
}) {
  const { cart } = args;
  if (cart.items.length === 0) throw new OrderError("El carrito está vacío.");

  const courier = checkCourierLimits(cart.totalUsd, cart.totalWeightKg);
  if (!courier.ok) throw new OrderError(courier.errors.join(" "));

  const address = await db.address.findFirst({ where: { id: args.addressId, userId: args.userId } });
  if (!address) throw new OrderError("La dirección no existe o no es tuya.");

  return db.order.create({
    data: {
      userId: args.userId,
      addressId: args.addressId,
      docType: args.docType,
      docNumber: args.docNumber,
      itemsUsd: cart.totalUsd,
      totalUsd: cart.totalUsd,
      totalWeightKg: cart.totalWeightKg,
      paymentStatus: "PENDIENTE",
      state: "PAGADO", // estado logístico inicial; solo es visible tras confirmar pago
      items: {
        create: cart.items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id ?? null,
          quantity: i.quantity,
          unitPriceUsd: i.product.priceUsd,
          unitWeightKg: i.product.weightKg,
        })),
      },
    },
  });
}

/**
 * Confirma el pago contra el procesador y deja el pedido operable:
 * evento PAGADO, Shipment vacío, ProcurementOrders por proveedor y email.
 * Idempotente: si ya estaba pagado, no repite nada.
 */
export async function confirmOrderPayment(orderId: string): Promise<{ ok: boolean; reason?: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return { ok: false, reason: "Pedido inexistente." };
  if (order.paymentStatus === "PAGADO") return { ok: true };
  if (!order.paymentExternalId) return { ok: false, reason: "El pedido no tiene un pago iniciado." };

  const { getPaymentProvider } = await import("@/lib/payments");
  const confirmation = await getPaymentProvider().confirmPayment(order.paymentExternalId);
  if (confirmation.status !== "approved") {
    await db.order.update({ where: { id: orderId }, data: { paymentStatus: "FALLIDO" } });
    return { ok: false, reason: confirmation.reason };
  }

  const suppliers = [...new Set(order.items.map((i) => i.product.supplierId))];
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAGADO" } }),
    db.statusEvent.create({
      data: { orderId, fromState: null, toState: "PAGADO", note: "Pago confirmado" },
    }),
    db.shipment.upsert({ where: { orderId }, create: { orderId }, update: {} }),
    ...suppliers.map((supplierId) =>
      db.procurementOrder.create({ data: { orderId, supplierId } }),
    ),
  ]);

  await getMailer().send(
    paymentConfirmedMail({
      to: order.user.email,
      name: order.user.name,
      orderNumber: order.number,
      totalUsd: order.totalUsd.toNumber(),
    }),
  );
  return { ok: true };
}

const SHIPMENT_DATE_FIELD: Partial<Record<LogisticState, "boughtAt" | "atDepotAt" | "shippedAt" | "atCustomsAt" | "deliveredAt">> = {
  COMPRADO_EN_ORIGEN: "boughtAt",
  RECIBIDO_DEPOSITO_EXTERIOR: "atDepotAt",
  EMBARCADO: "shippedAt",
  EN_ADUANA: "atCustomsAt",
  ENTREGADO: "deliveredAt",
};

/**
 * Avanza el estado logístico de un pedido. La transición se valida acá,
 * en el servidor, contra el enum — nunca se confía en el cliente.
 * CANCELADO exige motivo. Cada avance dispara email al cliente.
 */
export async function advanceOrderState(args: {
  orderId: string;
  toState: LogisticState;
  actorId: string;
  note?: string;
}): Promise<void> {
  const order = await db.order.findUnique({ where: { id: args.orderId }, include: { user: true } });
  if (!order) throw new OrderError("Pedido inexistente.");
  if (order.paymentStatus !== "PAGADO") throw new OrderError("El pedido no tiene el pago confirmado.");
  if (!isValidTransition(order.state, args.toState)) {
    throw new OrderError(`Transición inválida: de ${order.state} a ${args.toState}.`);
  }
  const note = args.note?.trim() || undefined;
  if (args.toState === "CANCELADO" && !note) {
    throw new OrderError("Para cancelar un pedido el motivo es obligatorio.");
  }

  // Cancelación de un pedido ya cobrado ⇒ reembolso vía el procesador.
  // Se intenta ANTES de tocar la DB: si el procesador falla, el pedido queda
  // como estaba y el operador ve el error (no cancelamos sin devolver plata).
  let refunded = false;
  if (args.toState === "CANCELADO" && order.paymentExternalId) {
    const { getPaymentProvider } = await import("@/lib/payments");
    try {
      await getPaymentProvider().refund(order.paymentExternalId);
      refunded = true;
    } catch (e) {
      throw new OrderError(
        `No se pudo reembolsar el pago en el procesador: ${e instanceof Error ? e.message : "error desconocido"}. El pedido NO se canceló.`,
      );
    }
  }

  const dateField = SHIPMENT_DATE_FIELD[args.toState];
  await db.$transaction([
    db.order.update({
      where: { id: args.orderId },
      data: {
        state: args.toState,
        ...(args.toState === "CANCELADO" ? { cancelReason: note } : {}),
        ...(refunded ? { paymentStatus: "REEMBOLSADO" as const } : {}),
      },
    }),
    db.statusEvent.create({
      data: {
        orderId: args.orderId,
        fromState: order.state,
        toState: args.toState,
        note,
        actorId: args.actorId,
      },
    }),
    ...(dateField
      ? [
          db.shipment.upsert({
            where: { orderId: args.orderId },
            create: { orderId: args.orderId, [dateField]: new Date() },
            update: { [dateField]: new Date() },
          }),
        ]
      : []),
  ]);

  await getMailer().send(
    stateChangedMail({
      to: order.user.email,
      name: order.user.name,
      orderNumber: order.number,
      newState: args.toState,
      note,
    }),
  );
}
