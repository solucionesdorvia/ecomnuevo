"use server";

import { revalidatePath } from "next/cache";
import type { LogisticState } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { advanceOrderState, confirmOrderPayment, discardUnpaidTransfer, OrderError } from "@/lib/orders";

export type AdvanceState = { error?: string; ok?: boolean };

export async function advanceState(_prev: AdvanceState, formData: FormData): Promise<AdvanceState> {
  const actor = await requireRole("OPERADOR", "ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  const toState = String(formData.get("toState") ?? "") as LogisticState;
  const note = String(formData.get("note") ?? "");

  try {
    await advanceOrderState({ orderId, toState, actorId: actor.id, note });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/operador/pedidos/${orderId}`);
  revalidatePath("/operador");
  return { ok: true };
}

/**
 * El operador confirma que la transferencia del cliente efectivamente entró.
 * Solo aplica a pedidos de transferencia que todavía están PENDIENTE: dispara
 * la misma confirmación de pago que usa la pasarela (evento PAGADO, compras a
 * proveedor, email al cliente).
 */
export async function confirmTransfer(formData: FormData): Promise<void> {
  const actor = await requireRole("OPERADOR", "ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentProvider: true, paymentStatus: true },
  });
  if (order && order.paymentProvider === "transferencia" && order.paymentStatus === "PENDIENTE") {
    await confirmOrderPayment(orderId, actor.id);
  }
  revalidatePath(`/operador/pedidos/${orderId}`);
  revalidatePath("/operador");
}

/** Descarta una transferencia que nunca llegó (con motivo). */
export async function discardTransfer(_prev: AdvanceState, formData: FormData): Promise<AdvanceState> {
  const actor = await requireRole("OPERADOR", "ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  try {
    await discardUnpaidTransfer({ orderId, actorId: actor.id, reason: String(formData.get("reason") ?? "") });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/operador/pedidos/${orderId}`);
  revalidatePath("/operador");
  return { ok: true };
}
