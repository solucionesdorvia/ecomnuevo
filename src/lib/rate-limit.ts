import "server-only";
import { headers } from "next/headers";

// Límite de intentos en memoria (ventana fija). Alcanza para una sola instancia en
// Railway; si se escala a varias, mover a la base o a Redis.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/** true si se permite el intento; false si se pasó del límite. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export const TOO_MANY = "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
