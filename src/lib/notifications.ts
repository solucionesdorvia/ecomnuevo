import type { LogisticState } from "@prisma/client";
import { db } from "@/lib/db";

// Novedades del cliente = los mismos StatusEvent que disparan el mail, pero
// leídos desde la campanita. "No leído" = evento posterior a notificationsSeenAt.

export type NotificationItem = {
  id: string;
  orderId: string;
  orderNumber: number;
  toState: LogisticState;
  note: string | null;
  timeLabel: string;
  unread: boolean;
};

const FEED_SIZE = 12;

export async function getNotificationFeed(user: {
  id: string;
  notificationsSeenAt: Date | null;
}): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const seen = user.notificationsSeenAt;
  const [events, unreadCount] = await Promise.all([
    db.statusEvent.findMany({
      where: { order: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: FEED_SIZE,
      select: {
        id: true,
        orderId: true,
        toState: true,
        note: true,
        createdAt: true,
        order: { select: { number: true } },
      },
    }),
    db.statusEvent.count({
      where: {
        order: { userId: user.id },
        ...(seen ? { createdAt: { gt: seen } } : {}),
      },
    }),
  ]);

  const items: NotificationItem[] = events.map((e) => ({
    id: e.id,
    orderId: e.orderId,
    orderNumber: e.order.number,
    toState: e.toState,
    note: e.note,
    timeLabel: relativeTime(e.createdAt),
    unread: !seen || e.createdAt > seen,
  }));

  return { items, unreadCount };
}

// Etiqueta relativa en español rioplatense. Se calcula en servidor y se pasa
// como string para no arriesgar mismatch de hidratación (no necesita ser "vivo":
// el contador se refresca al navegar).
function relativeTime(date: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "recién";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
