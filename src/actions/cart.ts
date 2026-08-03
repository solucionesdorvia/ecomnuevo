"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { MAX_QTY, readCartCookie, writeCartCookie } from "@/lib/cart";

export type CartActionResult = { ok: true } | { ok: false; error: string };

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<CartActionResult> {
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "Cantidad inválida." };
  const product = await db.product.findUnique({ where: { id: productId }, include: { variants: true } });
  if (!product || !product.active) return { ok: false, error: "El producto no está disponible." };
  if (product.variants.length > 0 && !variantId) {
    return { ok: false, error: "Elegí una variante antes de agregar al carrito." };
  }
  if (variantId && !product.variants.some((v) => v.id === variantId && v.available)) {
    return { ok: false, error: "La variante elegida no está disponible." };
  }

  const lines = await readCartCookie();
  const existing = lines.find((l) => l.p === productId && l.v === (variantId ?? null));
  if (existing) {
    existing.q = Math.min(existing.q + quantity, MAX_QTY);
  } else {
    lines.push({ p: productId, v: variantId ?? null, q: Math.min(quantity, MAX_QTY) });
  }
  await writeCartCookie(lines);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setLineQuantity(
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<CartActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QTY) {
    return { ok: false, error: "Cantidad inválida." };
  }
  let lines = await readCartCookie();
  if (quantity === 0) {
    lines = lines.filter((l) => !(l.p === productId && l.v === (variantId ?? null)));
  } else {
    const line = lines.find((l) => l.p === productId && l.v === (variantId ?? null));
    if (!line) return { ok: false, error: "El producto no está en el carrito." };
    line.q = quantity;
  }
  await writeCartCookie(lines);
  revalidatePath("/", "layout");
  return { ok: true };
}
