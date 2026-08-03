// Estimación de entrega: el pedido viaja consolidado, así que manda el ítem
// más lento. Devuelve el rango de fechas a comunicar.

export type DeliveryEstimate = { from: Date; to: Date; daysMin: number; daysMax: number };

export function estimateDelivery(
  items: { deliveryDaysMin: number; deliveryDaysMax: number }[],
  since: Date = new Date(),
): DeliveryEstimate | null {
  if (items.length === 0) return null;
  const daysMin = Math.max(...items.map((i) => i.deliveryDaysMin));
  const daysMax = Math.max(...items.map((i) => i.deliveryDaysMax));
  const day = 24 * 60 * 60 * 1000;
  return {
    daysMin,
    daysMax,
    from: new Date(since.getTime() + daysMin * day),
    to: new Date(since.getTime() + daysMax * day),
  };
}

/** "entre el 2 y el 17 de septiembre" / "entre el 28 de agosto y el 12 de septiembre" */
export function formatDeliveryRange(e: DeliveryEstimate): string {
  const dayMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });
  const sameMonth = e.from.getMonth() === e.to.getMonth() && e.from.getFullYear() === e.to.getFullYear();
  if (sameMonth) {
    return `entre el ${e.from.getDate()} y el ${dayMonth.format(e.to)}`;
  }
  return `entre el ${dayMonth.format(e.from)} y el ${dayMonth.format(e.to)}`;
}
