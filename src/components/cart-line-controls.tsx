"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { setLineQuantity } from "@/actions/cart";

export function CartLineControls({
  productId,
  variantId,
  quantity,
}: {
  productId: string;
  variantId: string | null;
  quantity: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const set = (q: number) =>
    startTransition(async () => {
      await setLineQuantity(productId, variantId, q);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center rounded-lg border border-border bg-background ${pending ? "opacity-50" : ""}`}>
        <button
          onClick={() => set(quantity - 1)}
          disabled={pending}
          className="flex size-8 cursor-pointer items-center justify-center text-muted hover:text-foreground"
          aria-label="Restar uno"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-7 text-center text-sm tabular-nums">{quantity}</span>
        <button
          onClick={() => set(quantity + 1)}
          disabled={pending || quantity >= 10}
          className="flex size-8 cursor-pointer items-center justify-center text-muted hover:text-foreground disabled:opacity-40"
          aria-label="Sumar uno"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <button
        onClick={() => set(0)}
        disabled={pending}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
        aria-label="Quitar del carrito"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
