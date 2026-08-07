import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { formatDocumento } from "@/lib/documento";
import { formatKg } from "@/lib/format";
import { Ship } from "lucide-react";
import { estimateDelivery, formatDeliveryRange } from "@/lib/entrega";
import { CheckoutForm } from "@/components/checkout-form";
import { CourierMeter } from "@/components/courier-meter";
import { Price } from "@/components/price";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelado?: string; error?: string }>;
}) {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  if (cart.items.length === 0) redirect("/carrito");
  if (!cart.courier.ok) redirect("/carrito");

  const params = await searchParams;
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
  });

  const defaultDoc =
    user.docType && user.docNumber ? formatDocumento(user.docType, user.docNumber) : "";

  return (
    <div className="py-6">
      <h1 className="mb-2 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Pagar y zarpar</h1>
      <p className="mb-6 text-sm text-muted">
        Pagás en dólares con tarjeta. El precio es final: no hay ningún costo después.
      </p>

      {params.cancelado && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Cancelaste el pago. Tu carrito sigue intacto: podés intentarlo de nuevo cuando quieras.
        </div>
      )}
      {params.error === "pago" && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          El pago no se pudo completar. No se te cobró nada: probá de nuevo.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          addresses={addresses.map((a) => ({
            id: a.id,
            street: a.street,
            apartment: a.apartment,
            city: a.city,
            province: a.province,
            zipCode: a.zipCode,
            phone: a.phone,
          }))}
          defaultDoc={defaultDoc}
        />

        <div className="flex flex-col gap-4 lg:sticky lg:top-40">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="eyebrow mb-3 text-muted">Tu pedido</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {cart.items.map((i) => (
                <li key={`${i.product.id}-${i.variant?.id ?? "base"}`} className="flex justify-between gap-2">
                  <span className="text-muted">
                    {i.quantity}× {i.product.title}
                    {i.variant ? ` (${i.variant.value})` : ""}
                  </span>
                  <Price value={i.lineTotalUsd} final={false} className="text-foreground" />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="font-medium">Total ({formatKg(cart.totalWeightKg)})</span>
              <Price value={cart.totalUsd} className="text-xl" />
            </div>
            {(() => {
              const est = estimateDelivery(cart.items.map((i) => i.product));
              return est ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-background p-2.5 text-xs text-muted">
                  <Ship className="size-4 shrink-0 text-primary" />
                  Si pagás hoy, llega {formatDeliveryRange(est)} — viaja en barco, por eso el precio.
                </p>
              ) : null;
            })()}
          </div>
          <CourierMeter check={cart.courier} />
        </div>
      </div>
    </div>
  );
}
