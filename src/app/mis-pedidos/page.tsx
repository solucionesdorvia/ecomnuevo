import type { Metadata } from "next";
import Link from "next/link";
import type { LogisticState } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FLOW } from "@/lib/estados";
import { formatDate } from "@/lib/format";
import { Price } from "@/components/price";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi cuenta" };

function MiniProgress({ state }: { state: LogisticState }) {
  const reached = FLOW.indexOf(state);
  return (
    <div className="relative mt-3 h-3">
      <div className="absolute left-0 right-0 top-[5px] h-0.5 bg-primary/15" />
      <div
        className="absolute left-0 top-[5px] h-0.5 bg-accent"
        style={{ width: `${FLOW.length > 1 ? (Math.max(0, reached) / (FLOW.length - 1)) * 100 : 0}%` }}
      />
      <div className="relative flex justify-between">
        {FLOW.map((s, i) => (
          <span
            key={s}
            className={cn(
              "size-3 rounded-full",
              i < reached
                ? "bg-accent"
                : i === reached
                  ? "border-[3px] border-accent bg-background"
                  : "bg-primary/18",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: { id: string; number: number; state: LogisticState; createdAt: Date; totalUsd: unknown; count: number };
}) {
  const activo = order.state !== "ENTREGADO" && order.state !== "CANCELADO";
  return (
    <Link
      href={`/mis-pedidos/${order.id}`}
      className="block rounded-[10px] border border-primary/10 bg-surface p-4 transition-shadow hover:shadow-[0_14px_30px_rgba(12,33,54,.12)]"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono-ui text-xs font-bold text-primary">
          TRL-{String(order.number).padStart(5, "0")}
        </span>
        <span
          className={cn(
            "font-mono-ui text-[11px] uppercase",
            order.state === "CANCELADO" ? "text-red-600" : "text-accent",
          )}
        >
          {order.state.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-[13px] text-primary/70">
          {order.count} {order.count === 1 ? "producto" : "productos"} · {formatDate(order.createdAt)}
        </p>
        <Price value={order.totalUsd as number} className="font-display text-base" />
      </div>
      {activo && <MiniProgress state={order.state} />}
    </Link>
  );
}

export default async function MiCuentaPage() {
  const user = await requireUser("/mis-pedidos");
  const orders = await db.order.findMany({
    where: { userId: user.id, paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] } },
    include: { items: { select: { quantity: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((o) => ({
    id: o.id,
    number: o.number,
    state: o.state,
    createdAt: o.createdAt,
    totalUsd: o.totalUsd,
    count: o.items.reduce((a, i) => a + i.quantity, 0),
  }));
  const enViaje = rows.filter((o) => o.state !== "ENTREGADO" && o.state !== "CANCELADO");
  const historial = rows.filter((o) => o.state === "ENTREGADO" || o.state === "CANCELADO");

  return (
    <div className="pb-10">
      {/* Header de cuenta */}
      <div className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="eyebrow mt-2 text-celeste">
            {rows.length} {rows.length === 1 ? "carga traída" : "cargas traídas"} · cliente traelo.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {rows.length === 0 ? (
          <EmptyState
            title="Ninguna carga en el agua."
            subtitle="Cuando pidas algo, lo vas a ver acá desde que sale de la fábrica hasta tu puerta."
            cta={{ label: "Ver el catálogo →", href: "/catalogo" }}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {enViaje.length > 0 && (
              <section>
                <p className="eyebrow mb-3 text-muted">En viaje · {enViaje.length}</p>
                <div className="flex flex-col gap-3">
                  {enViaje.map((o) => (
                    <OrderCard key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
            {historial.length > 0 && (
              <section>
                <p className="eyebrow mb-3 text-muted">Historial</p>
                <div className="flex flex-col gap-3">
                  {historial.map((o) => (
                    <OrderCard key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
