import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCart } from "@/lib/cart";
import { formatKg } from "@/lib/format";
import { Price } from "@/components/price";
import { CourierMeter } from "@/components/courier-meter";
import { CartLineControls } from "@/components/cart-line-controls";

export const metadata: Metadata = { title: "Carrito" };

export default async function CarritoPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingCart className="size-12 text-muted/50" />
        <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
        <p className="text-muted">Todo lo que ves en el catálogo tiene precio final: producto, envío e impuestos.</p>
        <Link
          href="/catalogo"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Tu carrito</h1>
        <Link href="/catalogo" className="text-sm text-primary hover:underline">
          ← Seguir comprando
        </Link>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-3">
          {cart.items.map((item) => (
            <li
              key={`${item.product.id}-${item.variant?.id ?? "base"}`}
              className="flex gap-4 rounded-xl border border-border bg-surface p-3"
            >
              <Link href={`/p/${item.product.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image src={item.product.images[0]} alt="" fill sizes="80px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <Link href={`/p/${item.product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                  {item.product.title}
                </Link>
                {item.variant && (
                  <p className="text-xs text-muted">
                    {item.variant.kind}: {item.variant.value}
                  </p>
                )}
                <p className="text-xs text-muted">{formatKg(item.lineWeightKg)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <CartLineControls
                    productId={item.product.id}
                    variantId={item.variant?.id ?? null}
                    quantity={item.quantity}
                  />
                  <Price value={item.lineTotalUsd} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 lg:sticky lg:top-40">
          <CourierMeter check={cart.courier} />
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">Total</p>
              <Price value={cart.totalUsd} className="text-2xl" />
            </div>
            <p className="mt-1 text-xs text-muted">
              Precio final en dólares: producto, envío marítimo e impuestos incluidos.
            </p>
            {cart.courier.ok ? (
              <Link
                href="/checkout"
                className="mt-4 flex h-12 items-center justify-center rounded-lg bg-accent font-medium text-white transition-colors hover:bg-accent/90"
              >
                Continuar la compra
              </Link>
            ) : (
              <button
                disabled
                className="mt-4 h-12 w-full cursor-not-allowed rounded-lg bg-border font-medium text-muted"
              >
                Superás los topes del pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
