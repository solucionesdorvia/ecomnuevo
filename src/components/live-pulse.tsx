"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "./toast-host";
import { formatUsd } from "@/lib/format";

// Tiempo real por polling. Consulta /api/pulse cada 5s (se pausa cuando la
// pestaña está oculta y vuelve a consultar al reenfocar). Al detectar un cambio
// respecto del último snapshot: dispara un toast y refresca los server
// components (cola de operador, dashboard, campanita) sin recargar la página.

const INTERVAL = 5000;

type Pulse = {
  role: "CLIENTE" | "OPERADOR" | "ADMIN" | null;
  pending?: number;
  lastOrderNumber?: number | null;
  lastOrderTotalUsd?: number | null;
  todayCount?: number;
  notifUnread?: number;
  lastLabel?: string | null;
};

export function LivePulse() {
  const router = useRouter();
  const prev = useRef<Pulse | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const r = await fetch("/api/pulse", { cache: "no-store" });
        if (!r.ok) return;
        const d: Pulse = await r.json();
        if (!alive || !d.role) return;
        const p = prev.current;
        if (p && p.role === d.role) {
          if (d.role === "OPERADOR" || d.role === "ADMIN") {
            if (d.lastOrderNumber && d.lastOrderNumber !== p.lastOrderNumber) {
              showToast({
                icon: "🛒",
                title: `Nuevo pedido #${d.lastOrderNumber}`,
                body:
                  d.lastOrderTotalUsd != null
                    ? `${formatUsd(d.lastOrderTotalUsd)} · a preparar`
                    : "Pagado · a preparar",
                href: "/operador",
              });
              router.refresh();
            } else if (d.pending !== p.pending || d.todayCount !== p.todayCount) {
              router.refresh();
            }
          } else if (d.role === "CLIENTE") {
            if ((d.notifUnread ?? 0) > (p.notifUnread ?? 0)) {
              showToast({
                icon: "📦",
                title:
                  d.lastLabel && d.lastOrderNumber
                    ? `Pedido #${d.lastOrderNumber}: ${d.lastLabel}`
                    : "Novedad en tu pedido",
                body: "Tocá para ver el seguimiento",
                href: "/mis-pedidos",
              });
              router.refresh();
            }
          }
        }
        prev.current = d;
      } catch {
        // red intermitente: se reintenta en el próximo tick
      }
    };

    const tick = async () => {
      if (!document.hidden) await poll();
      timer = setTimeout(tick, INTERVAL);
    };

    void poll(); // baseline inmediato
    timer = setTimeout(tick, INTERVAL);

    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
