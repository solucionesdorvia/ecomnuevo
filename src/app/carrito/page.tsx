import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Ship } from "lucide-react";
import { getCart } from "@/lib/cart";
import { formatKg, formatUsd } from "@/lib/format";
import { CourierMeter } from "@/components/courier-meter";
import { CartLineControls } from "@/components/cart-line-controls";
import { EmptyState } from "@/components/empty-state";
import { skuFor } from "@/components/product-card";

export const metadata: Metadata = { title: "Tu carga" };

export default async function CarritoPage() {
  const cart = await getCart();

  if (cart.items.length === 0) {
    return (
      <div className="py-10">
        <EmptyState
          title="Todavía no zarpó nada."
          subtitle="Buscá algo que valga el viaje. Todo lo que ves tiene precio final: producto, envío e impuestos."
          cta={{ label: "Ver el catálogo →", href: "/catalogo" }}
        />
      </div>
    );
  }

  return (
    <div className="py-7">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Tu carga</h1>
        <Link href="/catalogo" className="font-mono-ui text-xs text-accent hover:underline">
          ← SEGUIR ELIGIENDO
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-3">
          {cart.items.map((item) => (
            <li
              key={`${item.product.id}-${item.variant?.id ?? "base"}`}
              className="flex gap-4 rounded-[10px] border border-primary/10 bg-surface p-3"
            >
              <Link
                href={`/p/${item.product.slug}`}
                className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-white"
              >
                <Image src={item.product.images[0]} alt="" fill sizes="80px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="font-mono-ui text-[10px] text-primary/50">
                  {skuFor(item.product.id)}
                  {item.variant ? ` · ${item.variant.value}` : ""} · {formatKg(item.lineWeightKg).toUpperCase()}
                </p>
                <Link
                  href={`/p/${item.product.slug}`}
                  className="line-clamp-2 text-sm font-semibold text-primary hover:text-accent"
                >
                  {item.product.title}
                </Link>
                <p data-price className="font-display text-lg font-extrabold text-primary">
                  {formatUsd(item.lineTotalUsd)}
                </p>
                <div className="mt-1">
                  <CartLineControls
                    productId={item.product.id}
                    variantId={item.variant?.id ?? null}
                    quantity={item.quantity}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4 lg:sticky lg:top-28">
          <CourierMeter check={cart.courier} />

          {/* Total — card navy */}
          <div className="rounded-[10px] bg-primary p-5 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow text-celeste">Total a pagar hoy</p>
                <p data-price className="mt-1.5 font-display text-4xl font-extrabold tracking-[-0.03em]">
                  {formatUsd(cart.totalUsd)}
                </p>
              </div>
              <p className="font-mono-ui text-[10px] text-celeste-soft">
                {cart.items.length} {cart.items.length === 1 ? "BULTO" : "BULTOS"}
              </p>
            </div>
            <p className="mt-2 text-xs text-celeste-soft">Un solo precio. Nada extra al recibir.</p>
          </div>

          <div className="flex items-start gap-2.5 rounded-[10px] bg-celeste-soft/60 p-3 text-[13px] leading-relaxed text-primary">
            <Ship className="mt-0.5 size-4 shrink-0" />
            <span>Confirmando aceptás que la carga viaja por barco: son ~45 a 60 días. No hay envío exprés.</span>
          </div>

          {cart.courier.ok ? (
            <Link
              href="/checkout"
              className="flex h-14 items-center justify-center rounded-[10px] bg-accent text-base font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Pagar y zarpar →
            </Link>
          ) : (
            <button
              disabled
              className="h-14 w-full cursor-not-allowed rounded-[10px] bg-primary/12 font-bold text-primary/40"
            >
              Superás los topes del pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
