import type { Metadata } from "next";
import Link from "next/link";
import type { LogisticState, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { STATE_LABEL } from "@/lib/estados";
import { formatDate, formatKg } from "@/lib/format";
import { Price } from "@/components/price";
import { StateBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Cola de pedidos" };

const FILTERS: (LogisticState | "TODOS" | "ACTIVOS")[] = [
  "ACTIVOS",
  "PAGADO",
  "COMPRADO_EN_ORIGEN",
  "RECIBIDO_DEPOSITO_EXTERIOR",
  "EMBARCADO",
  "EN_ADUANA",
  "ENTREGADO",
  "CANCELADO",
  "TODOS",
];

export default async function OperadorPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado = "ACTIVOS" } = await searchParams;

  const where: Prisma.OrderWhereInput = {
    paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] },
    ...(estado === "ACTIVOS"
      ? { state: { notIn: ["ENTREGADO", "CANCELADO"] } }
      : estado === "TODOS"
        ? {}
        : { state: estado as LogisticState }),
  };

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where,
      include: { user: true, items: true },
      orderBy: { createdAt: "asc" }, // los más viejos primero: son los más urgentes
    }),
    db.order.groupBy({
      by: ["state"],
      where: { paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] } },
      _count: true,
    }),
  ]);

  const countFor = (f: string) => {
    if (f === "TODOS") return counts.reduce((a, c) => a + c._count, 0);
    if (f === "ACTIVOS")
      return counts.filter((c) => c.state !== "ENTREGADO" && c.state !== "CANCELADO").reduce((a, c) => a + c._count, 0);
    return counts.find((c) => c.state === f)?._count ?? 0;
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Cola de pedidos</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ACTIVOS" ? "/operador" : `/operador?estado=${f}`}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${estado === f ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted hover:text-foreground"}`}
          >
            {f === "TODOS" ? "Todos" : f === "ACTIVOS" ? "Activos" : STATE_LABEL[f as LogisticState]} ·{" "}
            {countFor(f)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No hay pedidos en este estado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Ítems</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background">
                  <td className="px-4 py-3">
                    <Link href={`/operador/pedidos/${order.id}`} className="font-medium text-primary hover:underline">
                      #{order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">{order.user.name}</td>
                  <td className="px-4 py-3 text-muted">{order.items.reduce((a, i) => a + i.quantity, 0)}</td>
                  <td className="px-4 py-3 text-muted">{formatKg(order.totalWeightKg)}</td>
                  <td className="px-4 py-3">
                    <Price value={order.totalUsd} final={false} />
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={order.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
