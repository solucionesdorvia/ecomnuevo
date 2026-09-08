import type { Metadata } from "next";
import Link from "next/link";
import type { LogisticState, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { STATE_LABEL } from "@/lib/estados";
import { formatDate, formatKg } from "@/lib/format";
import { Price } from "@/components/price";
import { StateBadge } from "@/components/ui/badge";
import { OperadorFilters } from "@/components/operador-filters";

export const metadata: Metadata = { title: "Cola de pedidos" };

function periodStart(periodo?: string): Date | null {
  if (!periodo) return null;
  const d = new Date();
  if (periodo === "hoy") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (periodo === "7d") return new Date(Date.now() - 7 * 86400000);
  if (periodo === "30d") return new Date(Date.now() - 30 * 86400000);
  return null;
}

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
  searchParams: Promise<{ estado?: string; q?: string; periodo?: string; proveedor?: string }>;
}) {
  const { estado = "ACTIVOS", q = "", periodo = "", proveedor = "" } = await searchParams;

  // Filtros que aplican a TODOS los estados (buscador, fecha, proveedor). Se usan
  // también para los contadores de los chips, para que reflejen lo filtrado.
  const qTrim = q.trim().replace(/^#/, "");
  const qNum = /^\d+$/.test(qTrim) ? Number(qTrim) : null;
  const desde = periodStart(periodo);

  const baseWhere: Prisma.OrderWhereInput = {
    paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] },
    ...(qTrim
      ? {
          OR: [
            ...(qNum !== null ? [{ number: qNum }] : []),
            { user: { name: { contains: qTrim, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(desde ? { createdAt: { gte: desde } } : {}),
    ...(proveedor ? { items: { some: { product: { supplierId: proveedor } } } } : {}),
  };

  const estadoWhere: Prisma.OrderWhereInput =
    estado === "ACTIVOS"
      ? { state: { notIn: ["ENTREGADO", "CANCELADO"] } }
      : estado === "TODOS"
        ? {}
        : { state: estado as LogisticState };

  const where: Prisma.OrderWhereInput = { ...baseWhere, ...estadoWhere };

  const [orders, counts, suppliers] = await Promise.all([
    db.order.findMany({
      where,
      include: { user: true, items: true },
      orderBy: { createdAt: "asc" }, // los más viejos primero: son los más urgentes
    }),
    db.order.groupBy({
      by: ["state"],
      where: baseWhere,
      _count: true,
    }),
    db.supplier.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Los chips de estado preservan el resto de los filtros activos.
  const carry = new URLSearchParams();
  if (q) carry.set("q", q);
  if (periodo) carry.set("periodo", periodo);
  if (proveedor) carry.set("proveedor", proveedor);
  const chipHref = (f: string) => {
    const p = new URLSearchParams(carry);
    if (f !== "ACTIVOS") p.set("estado", f);
    const s = p.toString();
    return `/operador${s ? `?${s}` : ""}`;
  };

  const countFor = (f: string) => {
    if (f === "TODOS") return counts.reduce((a, c) => a + c._count, 0);
    if (f === "ACTIVOS")
      return counts.filter((c) => c.state !== "ENTREGADO" && c.state !== "CANCELADO").reduce((a, c) => a + c._count, 0);
    return counts.find((c) => c.state === f)?._count ?? 0;
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold tracking-[-0.02em]">Cola de pedidos</h1>

      <OperadorFilters suppliers={suppliers} />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={chipHref(f)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${estado === f ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted hover:text-foreground"}`}
          >
            {f === "TODOS" ? "Todos" : f === "ACTIVOS" ? "Activos" : STATE_LABEL[f as LogisticState]} ·{" "}
            {countFor(f)}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {q || periodo || proveedor
            ? "Ningún pedido coincide con los filtros. Probá aflojar la búsqueda, la fecha o el proveedor."
            : "No hay pedidos en este estado."}
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
