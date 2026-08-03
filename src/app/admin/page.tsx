import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { STATE_LABEL } from "@/lib/estados";
import { FLOW } from "@/lib/estados";
import { formatUsd } from "@/lib/format";
import { StateBadge } from "@/components/ui/badge";
import type { LogisticState } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [byState, monthAgg, totalAgg] = await Promise.all([
    db.order.groupBy({
      by: ["state"],
      where: { paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] } },
      _count: true,
    }),
    db.order.aggregate({
      where: { paymentStatus: "PAGADO", createdAt: { gte: monthStart } },
      _sum: { totalUsd: true },
      _count: true,
    }),
    db.order.aggregate({
      where: { paymentStatus: "PAGADO" },
      _avg: { totalUsd: true },
      _count: true,
    }),
  ]);

  const states: LogisticState[] = [...FLOW, "CANCELADO"];
  const countFor = (s: LogisticState) => byState.find((c) => c.state === s)?._count ?? 0;

  const cards = [
    { label: "Ventas del mes", value: formatUsd(monthAgg._sum.totalUsd ?? 0) },
    { label: "Pedidos del mes", value: String(monthAgg._count) },
    { label: "Ticket promedio", value: formatUsd(totalAgg._avg.totalUsd ?? 0) },
    { label: "Pedidos históricos", value: String(totalAgg._count) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-semibold">Pedidos por estado</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {states.map((s) => (
          <Link
            key={s}
            href={`/operador?estado=${s}`}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-shadow hover:shadow-md"
          >
            <StateBadge state={s} />
            <span className="text-xl font-semibold tabular-nums">{countFor(s)}</span>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Cada tarjeta linkea a la cola del operador filtrada por ese estado. {STATE_LABEL.PAGADO} ={" "}
        pendiente de compra en origen.
      </p>
    </div>
  );
}
