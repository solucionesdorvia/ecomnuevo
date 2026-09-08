"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { LogisticState } from "@prisma/client";
import { STATE_LABEL, STATE_DESCRIPTION } from "@/lib/estados";
import { markNotificationsSeen } from "@/actions/notifications";
import type { NotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

// Color del punto por estado — hito naranja (pago/embarque), verde entregado,
// rojo cancelado, celeste el resto.
const DOT: Record<LogisticState, string> = {
  PAGADO: "#FF5A1F",
  COMPRADO_EN_ORIGEN: "#8FCDEB",
  RECIBIDO_DEPOSITO_EXTERIOR: "#8FCDEB",
  EMBARCADO: "#FF5A1F",
  EN_ADUANA: "#8FCDEB",
  ENTREGADO: "#1FA97A",
  CANCELADO: "#DC2626",
};

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const ref = useRef<HTMLDivElement>(null);

  // Reconciliar con el server render tras navegar.
  useEffect(() => setUnread(unreadCount), [unreadCount]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    // Abrir marca como leído: optimista en el badge + persiste en server.
    if (next && unread > 0) {
      setUnread(0);
      markNotificationsSeen().catch(() => {});
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Novedades (${unread} sin leer)` : "Novedades"}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-muted">
              Novedades
            </span>
            <Link
              href="/mis-pedidos"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Ver todo
            </Link>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              No tenés novedades todavía.
            </p>
          ) : (
            <ul className="max-h-[24rem] overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/mis-pedidos/${n.orderId}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-background",
                      n.unread && "bg-celeste-soft/25",
                    )}
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: DOT[n.toState] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-primary">
                          Pedido #{n.orderNumber} · {STATE_LABEL[n.toState]}
                        </span>
                        <span className="shrink-0 font-mono-ui text-[10px] text-muted">
                          {n.timeLabel}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        {n.note ?? STATE_DESCRIPTION[n.toState]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
