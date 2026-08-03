"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/price";
import { cn } from "@/lib/utils";

type Variant = { id: string; kind: string; value: string; available: boolean };

export function BuyBox({
  productId,
  priceUsd,
  variants,
}: {
  productId: string;
  priceUsd: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const kinds = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const v of variants) {
      map.set(v.kind, [...(map.get(v.kind) ?? []), v]);
    }
    return [...map.entries()];
  }, [variants]);

  // Fase 1: cada producto tiene a lo sumo UNA dimensión de variante (talle O
  // color); el pedido guarda un variantId por ítem. La UI soporta más kinds,
  // pero solo puede viajar una elección al carrito.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChosen = kinds.every(([kind]) => selected[kind]);
  const variantId = kinds.length > 0 ? (selected[kinds[0][0]] ?? null) : null;
  const disabled = pending || (kinds.length > 0 && !allChosen);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await addToCart(productId, variantId, qty);
      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 4000);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const cta = (extra?: string) => (
    <Button variant="accent" size="lg" className={extra} disabled={disabled} onClick={submit}>
      {added ? (
        <>
          <Check className="size-5" /> Agregado
        </>
      ) : (
        <>
          <ShoppingCart className="size-5" />
          {pending ? "Agregando…" : "Agregar al carrito"}
        </>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      {kinds.map(([kind, list]) => (
        <div key={kind}>
          <p className="mb-2 text-sm font-medium">
            {kind}
            {selected[kind] && (
              <span className="ml-2 text-muted">{list.find((v) => v.id === selected[kind])?.value}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {list.map((v) => (
              <button
                key={v.id}
                disabled={!v.available}
                onClick={() => setSelected((s) => ({ ...s, [kind]: v.id }))}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  selected[kind] === v.id
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface hover:border-primary",
                )}
              >
                {v.value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-surface">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-10 cursor-pointer items-center justify-center text-muted hover:text-foreground"
            aria-label="Restar uno"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="flex size-10 cursor-pointer items-center justify-center text-muted hover:text-foreground"
            aria-label="Sumar uno"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {cta("hidden flex-1 md:inline-flex")}
      </div>

      {kinds.length > 0 && !allChosen && (
        <p className="text-xs text-muted">Elegí {kinds.map(([k]) => k.toLowerCase()).join(" y ")} para continuar.</p>
      )}
      {added && (
        <Link
          href="/carrito"
          className="inline-flex items-center gap-1 text-sm font-medium text-success hover:underline"
        >
          Agregado al carrito — ir a comprar <ArrowRight className="size-4" />
        </Link>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Barra de compra fija en mobile: el precio y el CTA siempre al alcance del pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0">
          <Price value={priceUsd * qty} className="text-lg" />
          <p className="truncate text-[11px] leading-tight text-muted">
            {qty > 1 ? `${qty} unidades · ` : ""}precio final en tu casa
          </p>
        </div>
        {cta("flex-1")}
      </div>
    </div>
  );
}
