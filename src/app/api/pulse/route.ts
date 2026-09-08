import { NextResponse } from "next/server";
import type { PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STATE_LABEL } from "@/lib/estados";

// Latido para el tiempo real por polling. El cliente lo consulta cada pocos
// segundos y, según el rol, devuelve una señal de cambio liviana:
//  - OPERADOR/ADMIN: último pedido + pendientes + métricas del día.
//  - CLIENTE: novedades sin leer + el último cambio de estado.
// Sin caché: siempre el estado actual.

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ role: null }, noStore);

  if (user.role === "OPERADOR" || user.role === "ADMIN") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const paid = { paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] as PaymentStatus[] } };
    const [pending, last, today] = await Promise.all([
      db.order.count({ where: { ...paid, state: { notIn: ["ENTREGADO", "CANCELADO"] } } }),
      db.order.findFirst({
        where: paid,
        orderBy: { createdAt: "desc" },
        select: { number: true, totalUsd: true },
      }),
      db.order.aggregate({
        where: { paymentStatus: "PAGADO", createdAt: { gte: startOfDay } },
        _sum: { totalUsd: true },
        _count: true,
      }),
    ]);
    return NextResponse.json(
      {
        role: user.role,
        pending,
        lastOrderNumber: last?.number ?? null,
        lastOrderTotalUsd: last?.totalUsd.toNumber() ?? null,
        todayCount: today._count,
        todayRevenueUsd: today._sum.totalUsd?.toNumber() ?? 0,
      },
      noStore,
    );
  }

  // CLIENTE
  const seen = user.notificationsSeenAt;
  const [unread, latest] = await Promise.all([
    db.statusEvent.count({
      where: { order: { userId: user.id }, ...(seen ? { createdAt: { gt: seen } } : {}) },
    }),
    db.statusEvent.findFirst({
      where: { order: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      select: { toState: true, order: { select: { number: true } } },
    }),
  ]);
  return NextResponse.json(
    {
      role: user.role,
      notifUnread: unread,
      lastOrderNumber: latest?.order.number ?? null,
      lastLabel: latest ? STATE_LABEL[latest.toState] : null,
    },
    noStore,
  );
}
