import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDocumento } from "@/lib/documento";
import { estimateDelivery, formatDeliveryRange } from "@/lib/entrega";
import { formatDate, formatKg } from "@/lib/format";
import { Price } from "@/components/price";
import { StateBadge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderProgress } from "@/components/order-progress";
import { RouteLine } from "@/components/route-line";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const user = await requireUser("/mis-pedidos");
  const { id } = await params;
  const { nuevo } = await searchParams;

  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { include: { product: true, variant: true } },
      address: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.paymentStatus === "PENDIENTE" || order.paymentStatus === "FALLIDO") notFound();

  return (
    <div className="py-6">
      <Link href="/mis-pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronLeft className="size-4" /> Mis pedidos
      </Link>

      {nuevo && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-success/10 p-4 text-success">
          <CheckCircle2 className="size-6 shrink-0" />
          <div>
            <p className="font-semibold">¡Listo! Recibimos tu pago.</p>
            <p className="text-sm">
              Te mandamos la confirmación por email. Desde acá seguís cada paso del viaje.
            </p>
          </div>
        </div>
      )}

      {/* Tracking hero — código de carga + stepper + ruta */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-primary p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.03em] sm:text-4xl">Seguí tu carga</h1>
            <p className="mt-1.5 text-sm text-celeste-soft">Tu carga, a la vista siempre.</p>
          </div>
          <div className="rounded-[10px] border border-celeste/30 bg-primary-2 px-4 py-3">
            <p className="eyebrow text-celeste">Código de carga</p>
            <p className="mt-1.5 font-mono-ui text-lg font-bold sm:text-2xl">
              TRL-{formatDate(order.createdAt).replace(/\D+/g, "").slice(-4)}-{String(order.number).padStart(5, "0")}
            </p>
            <div className="mt-2 flex gap-4 font-mono-ui text-[11px] text-celeste-soft">
              <span>{formatKg(order.totalWeightKg).toUpperCase()}</span>
              <StateBadge state={order.state} />
            </div>
          </div>
        </div>

        {order.state !== "CANCELADO" && (
          <>
            <div className="mt-8">
              <OrderProgress currentState={order.state} events={order.statusEvents} />
            </div>
            <div className="mx-auto mt-6 max-w-md">
              <RouteLine
                origin="ORIGEN"
                destination={order.state === "ENTREGADO" ? "ENTREGADA" : "EN TRÁNSITO"}
                destinationMuted={order.state !== "ENTREGADO"}
              />
            </div>
          </>
        )}
      </div>

      {order.state === "CANCELADO" && order.cancelReason && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Motivo de la cancelación</p>
          <p>{order.cancelReason}</p>
          {order.paymentStatus === "REEMBOLSADO" && <p className="mt-1">El pago fue reembolsado.</p>}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <h2 className="eyebrow mb-5 text-muted">Bitácora</h2>
          <OrderTimeline currentState={order.state} events={order.statusEvents} />
          {order.state !== "ENTREGADO" && order.state !== "CANCELADO" && (() => {
            const est = estimateDelivery(
              order.items.map((i) => i.product),
              order.createdAt,
            );
            return (
              <p className="mt-4 rounded-lg bg-background p-3 text-xs text-muted">
                Tu pedido viaja en barco, consolidado.{" "}
                {est ? (
                  <>
                    Entrega estimada: <strong className="text-foreground">{formatDeliveryRange(est)}</strong>.
                  </>
                ) : (
                  "La entrega estimada es de 45 a 60 días desde la compra."
                )}{" "}
                Te avisamos por email en cada paso.
              </p>
            );
          })()}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="eyebrow mb-3 text-muted">Productos</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image src={item.product.images[0]} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/p/${item.product.slug}`} className="line-clamp-2 hover:text-primary">
                      {item.product.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {item.quantity} × <Price value={item.unitPriceUsd} final={false} className="font-normal text-muted" />
                      {item.variant ? ` · ${item.variant.kind}: ${item.variant.value}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-medium">Total pagado ({formatKg(order.totalWeightKg)})</span>
              <Price value={order.totalUsd} className="text-lg" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <h2 className="eyebrow mb-2 text-muted">Entrega</h2>
            <p>
              {order.address.street}
              {order.address.apartment ? `, ${order.address.apartment}` : ""}
            </p>
            <p className="text-muted">
              {order.address.city}, {order.address.province} ({order.address.zipCode})
            </p>
            <p className="mt-2 text-xs text-muted">
              Importador: {order.docType} {formatDocumento(order.docType, order.docNumber)} — tu
              compra entra al país a tu nombre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
