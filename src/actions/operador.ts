"use server";

import { revalidatePath } from "next/cache";
import type { LogisticState } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { advanceOrderState, OrderError } from "@/lib/orders";

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
