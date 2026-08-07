import { cn } from "@/lib/utils";

/**
 * Isologo de Traelo (sistema de diseño v1, de Andy).
 *
 * Tile de tinta oceánica clara (#132D45) con una ruta punteada naranja que sale
 * de un origen celeste (la fábrica) y termina en un anillo naranja (tu puerta).
 * Los puntos de la ruta fluyen hacia el destino — es el único motion del sistema.
 * Respeta `prefers-reduced-motion` (el flujo se detiene vía globals.css).
 *
 * `tile=false` dibuja solo la marca, sin el fondo.
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
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      style={tile ? { borderRadius: "22%", background: "var(--primary-2)" } : undefined}
      aria-hidden="true"
    >
      {/* Origen — la fábrica (celeste) */}
      <circle cx="13" cy="44" r="4.5" fill="var(--celeste)" />
      {/* Ruta punteada fábrica → tu puerta */}
      <path
        d="M13 44 C 26 16, 36 14, 46 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="3 7"
        className={animated ? "traelo-dash" : undefined}
      />
      {/* Destino — tu puerta (anillo naranja) */}
      <circle cx="47" cy="27" r="8" fill="none" stroke="var(--accent)" strokeWidth="3" />
    </svg>
  );
}
