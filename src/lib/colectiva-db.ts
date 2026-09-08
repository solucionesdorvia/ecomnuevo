import "server-only";
import { db } from "@/lib/db";
import { buildState, type GroupBuyState, type Tier } from "@/lib/colectiva";

export async function getGroupBuyFull(id: string) {
  const gb = await db.groupBuy.findUnique({
    where: { id },
    include: {
      product: { select: { slug: true, title: true, images: true } },
      participants: { orderBy: { joinedAt: "desc" } },
    },
  });
  if (!gb) return null;
  const tiers = gb.tiers as unknown as Tier[];
  const units = gb.participants.reduce((a, p) => a + p.units, 0);
  const state = buildState({
    id: gb.id,
    status: gb.status,
    tiers,
    units,
    goalUnits: gb.goalUnits,
    participants: gb.participants.length,
    closesAt: gb.closesAt,
  });
  return {
    state,
    tiers,
    product: gb.product,
    recent: gb.participants.slice(0, 10).map((p) => ({ name: p.name, units: p.units })),
  };
}

export async function getGroupBuyState(id: string): Promise<GroupBuyState | null> {
  const full = await getGroupBuyFull(id);
  return full?.state ?? null;
}
