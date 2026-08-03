import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { validNextStates } from "@/lib/estados";
import { formatDocumento } from "@/lib/documento";
import { formatDate, formatDateTime, formatKg, formatUsd } from "@/lib/format";
import { Price } from "@/components/price";
import { StateBadge } from "@/components/ui/badge";
import { AdvanceStateForm } from "@/components/advance-state-form";
import { OrderTimeline } from "@/components/order-timeline";

export const metadata: Metadata = { title: "Pedido — Operador" };

export default async function OperadorPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { supplier: true } }, variant: true } },
      statusEvents: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      procurementOrders: { include: { supplier: true } },
    },
  });
  if (!order) notFound();

  const canOperate = order.paymentStatus === "PAGADO";

  return (
    <div>
      <Link href="/operador" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronLeft className="size-4" /> Cola de pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Pedido #{order.number}</h1>
        <StateBadge state={order.state} />
        <span className="text-sm text-muted">
          {formatDate(order.createdAt)} · pago: {order.paymentStatus.toLowerCase()} ({order.paymentProvider})
        </span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          {/* Ítems con link al proveedor */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">Ítems a comprar</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image src={item.product.images[0]} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">
                      {item.quantity} × {item.product.title}
                    </p>
                    {item.variant && (
                      <p className="text-muted">
                        {item.variant.kind}: <strong>{item.variant.value}</strong>
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      {formatUsd(item.unitPriceUsd)} c/u · {formatKg(item.unitWeightKg)} c/u
                    </p>
                    <p className="mt-1 text-xs">
                      Proveedor: {item.product.supplier.name} ({item.product.supplier.country} —{" "}
                      {item.product.supplier.depot})
                      {item.product.supplier.contactUrl && (
                        <a
                          href={item.product.supplier.contactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Abrir proveedor <ExternalLink className="size-3" />
                        </a>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Compras a proveedor */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">Compras a proveedor</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {order.procurementOrders.map((po) => (
                <li key={po.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span>
                    {po.supplier.name} <span className="text-xs text-muted">({po.supplier.country})</span>
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    {po.status.replaceAll("_", " ").toLowerCase()}
                  </span>
                </li>
              ))}
              {order.procurementOrders.length === 0 && (
                <p className="text-muted">Sin compras registradas todavía.</p>
              )}
            </ul>
          </section>

          {/* Historial auditable */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">Historial de estados</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {order.statusEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-2 border-b border-border pb-2 last:border-0">
                  <span className="text-xs tabular-nums text-muted">{formatDateTime(e.createdAt)}</span>
                  <span>
                    {e.fromState ? `${e.fromState} → ` : ""}
                    <strong>{e.toState}</strong>
                  </span>
                  <span className="text-xs text-muted">{e.actor ? `por ${e.actor.name}` : "sistema"}</span>
                  {e.note && <span className="w-full text-xs italic text-muted">“{e.note}”</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-40">
          {/* Avance de estado */}
          <section className="rounded-xl border-2 border-primary/30 bg-surface p-4">
            <h2 className="mb-3 font-semibold">Avanzar estado</h2>
            {canOperate ? (
              <AdvanceStateForm orderId={order.id} nextStates={validNextStates(order.state)} />
            ) : (
              <p className="text-sm text-muted">
                El pago no está confirmado ({order.paymentStatus.toLowerCase()}): no se puede operar.
              </p>
            )}
          </section>

          {/* Comprador */}
          <section className="rounded-xl border border-border bg-surface p-4 text-sm">
            <h2 className="mb-2 font-semibold">Comprador (importador)</h2>
            <p>{order.user.name}</p>
            <p className="text-muted">{order.user.email}</p>
            <p className="mt-1">
              {order.docType}: <strong>{formatDocumento(order.docType, order.docNumber)}</strong>
            </p>
            <div className="mt-3 border-t border-border pt-3">
              <p>
                {order.address.street}
                {order.address.apartment ? `, ${order.address.apartment}` : ""}
              </p>
              <p className="text-muted">
                {order.address.city}, {order.address.province} ({order.address.zipCode})
              </p>
              <p className="text-muted">Tel: {order.address.phone}</p>
            </div>
          </section>

          {/* Totales */}
          <section className="rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Total cobrado</span>
              <Price value={order.totalUsd} final={false} />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Peso total</span>
              <span className="tabular-nums">{formatKg(order.totalWeightKg)}</span>
            </div>
          </section>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Vista del cliente</h2>
            <OrderTimeline currentState={order.state} events={order.statusEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
