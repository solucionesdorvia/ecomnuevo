"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getGroupBuyState } from "@/lib/colectiva-db";
import type { GroupBuyState } from "@/lib/colectiva";

// Sumarse al contenedor. En el prototipo NO cobra: se reserva el lugar y el pago
// iría recién cuando el contenedor cierra (así el precio final ya está fijado).
export async function joinGroupBuy(id: string, units = 1): Promise<GroupBuyState | null> {
  const gb = await db.groupBuy.findUnique({ where: { id }, select: { status: true } });
  if (!gb || gb.status !== "ABIERTO") return null;
  const user = await getCurrentUser();
  await db.groupBuyParticipant.create({
    data: {
      groupBuyId: id,
      userId: user?.id ?? null,
      name: user ? user.name.split(" ")[0] : "Vos",
      units: Math.max(1, Math.min(3, Math.floor(units))),
    },
  });
  return getGroupBuyState(id);
}

const DEMO_NOMBRES = [
  "Juli P.", "Tomás R.", "Aldana S.", "Bruno M.", "Cata L.", "Fede G.", "Rocío V.",
  "Iván D.", "Pau C.", "Santi B.", "Male F.", "Nico A.", "Vale T.", "Gonza H.",
];

// Solo para la demo: simula que se suma otra persona, para mostrar el precio
// bajando en vivo durante la presentación.
export async function simularSuma(id: string): Promise<GroupBuyState | null> {
  const gb = await db.groupBuy.findUnique({ where: { id }, select: { status: true } });
  if (!gb || gb.status !== "ABIERTO") return null;
  await db.groupBuyParticipant.create({
    data: {
      groupBuyId: id,
      name: DEMO_NOMBRES[Math.floor(Math.random() * DEMO_NOMBRES.length)],
      units: Math.random() < 0.3 ? 2 : 1,
    },
  });
  return getGroupBuyState(id);
}
