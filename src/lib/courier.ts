// Régimen courier argentino: topes por envío, por destinatario individual.
// Regla dura de negocio — se valida SIEMPRE en el servidor antes de crear
// un pedido, además de mostrarse en la UI del carrito.

export const MAX_WEIGHT_KG = 50;
export const MAX_TOTAL_USD = 3000;
// RG 5884/2026 (ARCA): el régimen puerta a puerta simplificado admite envíos de
// hasta 3 unidades de la MISMA ESPECIE (mismo producto), para uso personal. Se
// agregan las cantidades de un mismo producto aunque estén en variantes distintas.
export const MAX_UNITS_PER_SPECIES = 3;
// Tope propio de Traelo (no es del régimen): lugar en el contenedor
// consolidado. Si el cliente quiere más, hace otro pedido.
export const MAX_VOLUME_M3 = 1;

/** Cantidad total de un mismo producto (especie) en el carrito. */
export type SpeciesCount = { label: string; units: number };

export type CourierCheck = {
  ok: boolean;
  totalUsd: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  /** 0..1 — qué tan lleno está el carrito contra cada tope */
  usdRatio: number;
  weightRatio: number;
  volumeRatio: number;
  /** Productos que superan el tope de unidades por especie. */
  overSpecies: SpeciesCount[];
  errors: string[];
};

export function checkCourierLimits(
  totalUsd: number,
  totalWeightKg: number,
  species: SpeciesCount[] = [],
  totalVolumeM3 = 0,
): CourierCheck {
  const ar = (v: number, dec = 2) =>
    new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(v);
  const errors: string[] = [];
  if (totalUsd > MAX_TOTAL_USD) {
    errors.push(
      `El total (US$ ${ar(totalUsd)}) supera el tope de US$ ${ar(MAX_TOTAL_USD)} por pedido del régimen courier. Dividí la compra en más de un pedido.`,
    );
  }
  if (totalWeightKg > MAX_WEIGHT_KG) {
    errors.push(
      `El peso total (${ar(totalWeightKg, 1)} kg) supera el tope de ${ar(MAX_WEIGHT_KG)} kg por pedido del régimen courier. Dividí la compra en más de un pedido.`,
    );
  }
  if (totalVolumeM3 > MAX_VOLUME_M3) {
    errors.push(
      `El volumen total (${ar(totalVolumeM3, 2)} m³) supera el tope de ${ar(MAX_VOLUME_M3)} m³ por pedido. Si necesitás más, hacé otro pedido con el resto.`,
    );
  }
  const overSpecies = species.filter((s) => s.units > MAX_UNITS_PER_SPECIES);
  for (const s of overSpecies) {
    errors.push(
      `“${s.label}”: llevás ${s.units} unidades. El régimen puerta a puerta permite hasta ${MAX_UNITS_PER_SPECIES} unidades del mismo producto por pedido. Bajá la cantidad a ${MAX_UNITS_PER_SPECIES} o menos.`,
    );
  }
  return {
    ok: errors.length === 0,
    totalUsd,
    totalWeightKg,
    totalVolumeM3,
    usdRatio: Math.min(totalUsd / MAX_TOTAL_USD, 1),
    weightRatio: Math.min(totalWeightKg / MAX_WEIGHT_KG, 1),
    volumeRatio: Math.min(totalVolumeM3 / MAX_VOLUME_M3, 1),
    overSpecies,
    errors,
  };
}
