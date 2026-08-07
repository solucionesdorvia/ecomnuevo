const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "code",
});

/** US$ 1.234,56 (formato es-AR) */
export function formatUsd(value: number | string | { toNumber(): number }): string {
  const n = typeof value === "object" ? value.toNumber() : Number(value);
  return usd.format(n).replace("USD", "US$").trim();
}

// El diseño "traelo. v1" muestra el precio final AL CLIENTE en pesos. Los precios
// en DB están en USD (costeo/checkout); esto es sólo la conversión de exhibición
// (tasa demo). El motor de pago sigue en USD hasta que se integre MercadoPago/pesos.
export const ARS_PER_USD = 1300;

/** $74.500 — precio final en pesos (redondeado a $100) desde un valor en USD. */
export function formatArs(value: number | string | { toNumber(): number }): string {
  const n = (typeof value === "object" ? value.toNumber() : Number(value)) * ARS_PER_USD;
  const rounded = Math.round(n / 100) * 100;
  return `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(rounded)}`;
}

export function formatKg(value: number | string | { toNumber(): number }): string {
  const n = typeof value === "object" ? value.toNumber() : Number(value);
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n)} kg`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
