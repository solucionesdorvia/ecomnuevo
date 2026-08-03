import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { checkCourierLimits, type CourierCheck } from "@/lib/courier";

// Carrito en cookie (sin login): [{p: productId, v: variantId|null, q: cantidad}]

const CART_COOKIE = "sp_cart";
const MAX_QTY = 10;

export type CartLine = { p: string; v: string | null; q: number };

export async function readCartCookie(): Promise<CartLine[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l?.p === "string" && (l.v === null || typeof l.v === "string") && Number.isInteger(l.q) && l.q > 0,
      )
      .map((l) => ({ ...l, q: Math.min(l.q, MAX_QTY) }));
  } catch {
    return [];
  }
}

export async function writeCartCookie(lines: CartLine[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type CartItem = {
  product: {
    id: string;
    slug: string;
    title: string;
    images: string[];
    priceUsd: number;
    weightKg: number;
    active: boolean;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
  };
  variant: { id: string; kind: string; value: string } | null;
  quantity: number;
  lineTotalUsd: number;
  lineWeightKg: number;
};

export type Cart = {
  items: CartItem[];
  totalUsd: number;
  totalWeightKg: number;
  courier: CourierCheck;
  count: number;
};

/** Resuelve la cookie contra la DB (precios y pesos actuales, productos activos). */
export async function getCart(): Promise<Cart> {
  const lines = await readCartCookie();
  const items: CartItem[] = [];
  if (lines.length > 0) {
    const products = await db.product.findMany({
      where: { id: { in: lines.map((l) => l.p) } },
      include: { variants: true },
    });
    for (const line of lines) {
      const product = products.find((p) => p.id === line.p);
      if (!product || !product.active) continue;
      const variant = line.v ? product.variants.find((v) => v.id === line.v) ?? null : null;
      if (line.v && !variant) continue;
      const priceUsd = product.priceUsd.toNumber();
      const weightKg = product.weightKg.toNumber();
      items.push({
        product: {
          id: product.id,
          slug: product.slug,
          title: product.title,
          images: product.images,
          priceUsd,
          weightKg,
          active: product.active,
          deliveryDaysMin: product.deliveryDaysMin,
          deliveryDaysMax: product.deliveryDaysMax,
        },
        variant: variant ? { id: variant.id, kind: variant.kind, value: variant.value } : null,
        quantity: line.q,
        lineTotalUsd: priceUsd * line.q,
        lineWeightKg: weightKg * line.q,
      });
    }
  }
  const totalUsd = items.reduce((a, i) => a + i.lineTotalUsd, 0);
  const totalWeightKg = items.reduce((a, i) => a + i.lineWeightKg, 0);
  return {
    items,
    totalUsd,
    totalWeightKg,
    courier: checkCourierLimits(totalUsd, totalWeightKg),
    count: items.reduce((a, i) => a + i.quantity, 0),
  };
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}

export { MAX_QTY };
