// Régimen courier argentino: topes por envío, por destinatario individual.
// Regla dura de negocio — se valida SIEMPRE en el servidor antes de crear
// un pedido, además de mostrarse en la UI del carrito.

export const MAX_WEIGHT_KG = 50;
export const MAX_TOTAL_USD = 3000;

export type CourierCheck = {
  ok: boolean;
  totalUsd: number;
  totalWeightKg: number;
  /** 0..1 — qué tan lleno está el carrito contra cada tope */
  usdRatio: number;
  weightRatio: number;
  errors: string[];
};

export function checkCourierLimits(totalUsd: number, totalWeightKg: number): CourierCheck {
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
  return {
    ok: errors.length === 0,
    totalUsd,
    totalWeightKg,
    usdRatio: Math.min(totalUsd / MAX_TOTAL_USD, 1),
    weightRatio: Math.min(totalWeightKg / MAX_WEIGHT_KG, 1),
    errors,
  };
}
