"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { LogisticState } from "@prisma/client";
import { showToast } from "./toast-host";
import { formatUsd } from "@/lib/format";

// Copy/icono/tono por estado: cada novedad se ve distinta según el evento real
// (no es lo mismo un pago que una cancelación).
const STATE_TOAST: Partial<
  Record<LogisticState, { icon: string; title: string; body: string; tone?: "success" | "danger" }>
> = {
  PAGADO: { icon: "✅", title: "Pago confirmado", body: "Estamos gestionando tu compra." },
  COMPRADO_EN_ORIGEN: { icon: "🏭", title: "Comprado en origen", body: "Ya se lo compramos al proveedor." },
  RECIBIDO_DEPOSITO_EXTERIOR: { icon: "📥", title: "En depósito de origen", body: "Llegó a nuestro depósito." },
  EMBARCADO: { icon: "🚢", title: "¡Embarcado!", body: "Tu carga viaja en barco hacia Argentina." },
  EN_ADUANA: { icon: "🛃", title: "En la Aduana", body: "En la Aduana argentina, a tu nombre." },
  ENTREGADO: { icon: "🎉", title: "¡Entregado!", body: "Tu pedido llegó. ¡Gracias por comprar!", tone: "success" },
  CANCELADO: { icon: "⚠️", title: "Pedido cancelado", body: "Si correspondía, se reembolsó el pago.", tone: "danger" },
};

// Tiempo real por polling. Consulta /api/pulse cada 5s (se pausa cuando la
// pestaña está oculta y vuelve a consultar al reenfocar). Al detectar un cambio
// respecto del último snapshot: dispara un toast y refresca los server
// components (cola de operador, dashboard, campanita) sin recargar la página.

const INTERVAL = 4000;

type Pulse = {
  role: "CLIENTE" | "OPERADOR" | "ADMIN" | null;
  pending?: number;
  lastOrderNumber?: number | null;
  lastOrderTotalUsd?: number | null;
  todayCount?: number;
  notifUnread?: number;
  lastState?: LogisticState | null;
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
              const total = d.lastOrderTotalUsd;
              router.refresh();
              // El toast se agrega DESPUÉS del refresh para que no lo pise el
              // re-render de los server components.
              setTimeout(
                () =>
                  showToast({
                    icon: "🛒",
                    title: `Nuevo pedido #${d.lastOrderNumber}`,
                    body: total != null ? `${formatUsd(total)} · a preparar` : "Pagado · a preparar",
                    href: "/operador",
                  }),
                250,
              );
            } else if (d.pending !== p.pending || d.todayCount !== p.todayCount) {
              router.refresh();
            }
          } else if (d.role === "CLIENTE") {
            if ((d.notifUnread ?? 0) > (p.notifUnread ?? 0)) {
              const cfg = d.lastState ? STATE_TOAST[d.lastState] : undefined;
              const orderNumber = d.lastOrderNumber;
              router.refresh();
              setTimeout(
                () =>
                  showToast({
                    icon: cfg?.icon ?? "📦",
                    title:
                      cfg && orderNumber ? `Pedido #${orderNumber}: ${cfg.title}` : "Novedad en tu pedido",
                    body: cfg?.body ?? "Tocá para ver el seguimiento",
                    href: "/mis-pedidos",
                    tone: cfg?.tone,
                  }),
                250,
              );
            }
          }
        }
        prev.current = d;
      } catch {
        // red intermitente: se reintenta en el próximo tick
      }
    };

    // Consulta SIEMPRE (aunque la pestaña esté en segundo plano) para que el
    // operador/admin vea entrar los pedidos aunque el panel no esté enfocado.
    // El navegador igual limita el ritmo en background; al reenfocar consulta ya.
    const tick = async () => {
      await poll();
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
