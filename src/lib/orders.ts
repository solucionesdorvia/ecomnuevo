import "server-only";
import type { DocType, LogisticState } from "@prisma/client";
import { db } from "@/lib/db";
import { checkCourierLimits } from "@/lib/courier";
import { speciesCounts } from "@/lib/cart";
import { isValidTransition } from "@/lib/estados";
import { getMailer } from "@/lib/mailer";
import { newOrderOpsMail, paymentConfirmedMail, stateChangedMail } from "@/lib/mailer/templates";
import type { Mail } from "@/lib/mailer";
import type { Cart } from "@/lib/cart";

export class OrderError extends Error {}

/** Un mail que no sale no puede deshacer un pago ni un cambio de estado ya guardados. */
async function sendSafe(mail: Mail): Promise<void> {
  try {
    await getMailer().send(mail);
  } catch (e) {
    console.error("[orders] no se pudo enviar el mail:", e);
  }
}

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

  const courier = checkCourierLimits(
    cart.totalUsd,
    cart.totalWeightKg,
    speciesCounts(cart.items),
    cart.totalVolumeM3,
  );
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
export async function confirmOrderPayment(
  orderId: string,
  /** Quién la confirmó a mano (transferencia). Sin actor = la pasarela. */
  actorId?: string,
): Promise<{ ok: boolean; reason?: string; pending?: boolean }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return { ok: false, reason: "Pedido inexistente." };
  if (order.paymentStatus === "PAGADO") return { ok: true };
  // Cancelado es final: un reembolso o una transferencia descartada no vuelven a
  // cobrarse, y el procesador puede seguir informando el cobro original como pago.
  if (order.state === "CANCELADO") return { ok: false, reason: "El pedido está cancelado." };
  if (!order.paymentExternalId) return { ok: false, reason: "El pedido no tiene un pago iniciado." };

  const { getProviderByName } = await import("@/lib/payments");
  const providerName = order.paymentProvider ?? process.env.PAYMENT_PROVIDER ?? "mock";
  // TransferProvider aprueba siempre porque el chequeo es humano: sin un operador
  // no hubo chequeo. Se corta antes de consultarlo y sin tocar el pedido.
  if (providerName === "transferencia") {
    const actor = actorId
      ? await db.user.findUnique({ where: { id: actorId }, select: { role: true } })
      : null;
    if (actor?.role !== "OPERADOR" && actor?.role !== "ADMIN") {
      return { ok: false, reason: "La transferencia la confirma un operador." };
    }
  }
  const confirmation = await getProviderByName(providerName).confirmPayment(order.paymentExternalId);
  // Todavía sin resultado (el banco no contestó o el webhook no llegó): no se
  // toca el pedido; se vuelve a consultar más tarde.
  if (confirmation.status === "pending") return { ok: false, pending: true, reason: confirmation.reason };
  if (confirmation.status !== "approved") {
    await db.order.update({ where: { id: orderId }, data: { paymentStatus: "FALLIDO" } });
    return { ok: false, reason: confirmation.reason };
  }

  const suppliers = [...new Set(order.items.map((i) => i.product.supplierId))];
  // El webhook de la pasarela y la vuelta del cliente pueden llegar al mismo
  // tiempo: solo el primero que pasa el pedido a PAGADO arma la operación (y
  // manda los mails); el otro ve count 0 y sale sin duplicar nada.
  const won = await db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "PAGADO" } },
      data: { paymentStatus: "PAGADO" },
    });
    if (count === 0) return false;
    await tx.statusEvent.create({
      data: {
        orderId,
        fromState: null,
        toState: "PAGADO",
        note: actorId ? "Transferencia verificada" : "Pago confirmado",
        actorId: actorId ?? null,
      },
    });
    await tx.shipment.upsert({ where: { orderId }, create: { orderId }, update: {} });
    for (const supplierId of suppliers) {
      await tx.procurementOrder.create({ data: { orderId, supplierId } });
    }
    return true;
  });
  if (!won) return { ok: true };

  await sendSafe(
    paymentConfirmedMail({
      to: order.user.email,
      name: order.user.name,
      orderNumber: order.number,
      totalUsd: order.totalUsd.toNumber(),
    }),
  );
  // La transferencia la confirma el propio equipo: el aviso interno es solo para tarjeta.
  if (process.env.OPS_EMAIL && providerName !== "transferencia") {
    await sendSafe(
      newOrderOpsMail({
        to: process.env.OPS_EMAIL,
        orderId,
        orderNumber: order.number,
        totalUsd: order.totalUsd.toNumber(),
        customer: order.user.name,
        metodo: "tarjeta",
      }),
    );
  }
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
  if (args.toState === "CANCELADO" && !args.note?.trim()) {
    throw new OrderError("Para cancelar un pedido el motivo es obligatorio.");
  }

  // Cancelación de un pedido ya cobrado ⇒ reembolso vía el procesador.
  // Se intenta ANTES de tocar la DB: si el procesador falla, el pedido queda
  // como estaba y el operador ve el error (no cancelamos sin devolver plata).
  // La devolución va por el MISMO procesador que cobró. Una transferencia no
  // tiene procesador: se cancela y la devolución queda anotada para hacerla a mano.
  let refunded = false;
  let note = args.note?.trim() || undefined;
  if (args.toState === "CANCELADO" && order.paymentProvider === "transferencia") {
    note = `${note} — la transferencia se devuelve a mano, a la cuenta de origen`;
  } else if (args.toState === "CANCELADO" && order.paymentExternalId) {
    const { getProviderByName } = await import("@/lib/payments");
    try {
      await getProviderByName(order.paymentProvider ?? process.env.PAYMENT_PROVIDER ?? "mock").refund(
        order.paymentExternalId,
      );
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

  await sendSafe(
    stateChangedMail({
      to: order.user.email,
      name: order.user.name,
      orderNumber: order.number,
      newState: args.toState,
      note,
    }),
  );
}

/**
 * Descarta un pedido por transferencia que nunca se pagó (el cliente no
 * transfirió o pidió anularlo). No hay plata que devolver: queda FALLIDO +
 * CANCELADO con motivo, y sale de la lista de transferencias por confirmar.
 */
export async function discardUnpaidTransfer(args: {
  orderId: string;
  actorId: string;
  reason: string;
}): Promise<void> {
  const reason = args.reason.trim();
  if (!reason) throw new OrderError("Escribí el motivo para descartar el pedido.");
  const order = await db.order.findUnique({ where: { id: args.orderId } });
  if (!order) throw new OrderError("Pedido inexistente.");
  if (order.paymentProvider !== "transferencia" || order.paymentStatus !== "PENDIENTE") {
    throw new OrderError("Solo se descartan transferencias pendientes de pago.");
  }
  await db.$transaction([
    db.order.update({
      where: { id: args.orderId },
      data: { paymentStatus: "FALLIDO", state: "CANCELADO", cancelReason: reason },
    }),
    db.statusEvent.create({
      data: {
        orderId: args.orderId,
        fromState: null,
        toState: "CANCELADO",
        note: `Transferencia no recibida: ${reason}`,
        actorId: args.actorId,
      },
    }),
  ]);
}
