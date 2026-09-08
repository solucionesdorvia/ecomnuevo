// Compra colectiva: lógica de precio escalonado. Los tiers vienen de mayor a
// menor precio (minUnits creciente). El precio vigente es el del tier de mayor
// `minUnits` ya alcanzado por el total de unidades sumadas.

export type Tier = { minUnits: number; priceUsd: number };

export type GroupBuyState = {
  id: string;
  status: string;
  units: number;
  goalUnits: number;
  participants: number;
  basePriceUsd: number; // precio del primer tier (el más alto)
  priceUsd: number; // precio vigente
  tierIndex: number;
  next: { minUnits: number; priceUsd: number; unitsToGo: number } | null;
  closesAt: string;
};

export function priceForUnits(tiers: Tier[], units: number): { priceUsd: number; index: number } {
  let index = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (units >= tiers[i].minUnits) index = i;
  }
  return { priceUsd: tiers[index]?.priceUsd ?? 0, index };
}

export function nextTier(tiers: Tier[], units: number) {
  const t = tiers.find((x) => x.minUnits > units);
  return t ? { minUnits: t.minUnits, priceUsd: t.priceUsd, unitsToGo: t.minUnits - units } : null;
}

export function buildState(args: {
  id: string;
  status: string;
  tiers: Tier[];
  units: number;
  goalUnits: number;
  participants: number;
  closesAt: Date;
}): GroupBuyState {
  const { priceUsd, index } = priceForUnits(args.tiers, args.units);
  return {
    id: args.id,
    status: args.status,
    units: args.units,
    goalUnits: args.goalUnits,
    participants: args.participants,
    basePriceUsd: args.tiers[0]?.priceUsd ?? priceUsd,
    priceUsd,
    tierIndex: index,
    next: nextTier(args.tiers, args.units),
    closesAt: args.closesAt.toISOString(),
  };
}
