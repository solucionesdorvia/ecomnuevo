"use client";

import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import type { LogisticState } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Animación branded por estado de la compra (Lottie recoloreado a la paleta).
 * Una por estado en `public/animations/estados/`. Se carga en cliente y loopea.
 * Renderer `canvas` (mucho más rápido que SVG para animaciones con muchos shapes,
 * como el barco). Card claro para que lea bien; skeleton mientras carga; respeta
 * `prefers-reduced-motion`.
 */

const FILE: Partial<Record<LogisticState, string>> = {
  PAGADO: "pagado",
  COMPRADO_EN_ORIGEN: "comprado",
  RECIBIDO_DEPOSITO_EXTERIOR: "deposito",
  EMBARCADO: "embarcado",
  EN_ADUANA: "aduana",
  ENTREGADO: "entregado",
};

export function StateAnimation({ state, className }: { state: LogisticState; className?: string }) {
  const key = FILE[state];
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!key || !ref.current) return;
    let alive = true;
    let anim: AnimationItem | null = null;
    setReady(false);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    fetch(`/animations/estados/${key}.json`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive || !ref.current) return;
        anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "canvas",
          loop: !reduce,
          autoplay: !reduce,
          animationData: data,
          rendererSettings: { dpr, clearCanvas: true },
        });
        anim.addEventListener("DOMLoaded", () => alive && setReady(true));
        if (reduce) anim.goToAndStop(anim.totalFrames * 0.5, true);
      })
      .catch(() => {});
    return () => {
      alive = false;
      anim?.destroy();
    };
  }, [key]);

  if (!key) return null;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-2xl p-3", className)}
      style={{ background: "linear-gradient(180deg,#f3fafe,#e4f2fb)" }}
    >
      {!ready && (
        <span
          aria-hidden="true"
          className="absolute size-8 animate-ping rounded-full"
          style={{ background: "rgba(143,205,235,.45)" }}
        />
      )}
      <div ref={ref} aria-hidden="true" className="h-[86%] w-[86%]" />
    </div>
  );
}
