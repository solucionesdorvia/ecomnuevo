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
