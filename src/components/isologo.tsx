import { cn } from "@/lib/utils";

/**
 * Isologo de Traelo (sistema de diseño v1).
 *
 * Un tile de tinta oceánica con una ruta punteada naranja que va del origen
 * (punto celeste = la fábrica) al destino (nodo naranja = tu casa). Los puntos
 * de la ruta fluyen hacia el destino — es el único elemento en movimiento de
 * toda la identidad. Respeta `prefers-reduced-motion` (se detiene el flujo).
 *
 * `tile=false` dibuja solo la marca, sin el fondo, para usarla inline.
 */
export function Isologo({
  className,
  tile = true,
  animated = true,
}: {
  className?: string;
  tile?: boolean;
  animated?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden",
        tile && "rounded-2xl bg-primary",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" className="size-[62%]">
        {/* Ruta punteada fábrica → casa */}
        <path
          d="M12 34 C 18 20, 30 28, 36 14"
          stroke="var(--accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="0.1 7"
          className={animated ? "isologo-route" : undefined}
        />
        {/* Origen — la fábrica (celeste) */}
        <circle cx="12" cy="34" r="3.2" fill="var(--celeste)" />
        {/* Destino — tu casa (nodo naranja) */}
        <circle cx="36" cy="14" r="5" fill="var(--accent)" />
        <circle cx="36" cy="14" r="2" fill="var(--primary)" />
      </svg>
    </span>
  );
}
