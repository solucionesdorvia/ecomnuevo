import { cn } from "@/lib/utils";

/**
 * Isologo de Traelo v2 — lettermark "t.".
 *
 * La inicial en la tipografía real de la marca (Bricolage Grotesque 800) con el
 * punto naranja — el mismo carácter y el mismo punto que el wordmark `traelo.`,
 * ahora como marca que para sola. Elegida por Andy.
 *
 * `tile` dibuja el fondo navy redondeado (header/app-icon), con la "t" en blanco.
 * Sin tile, la "t" toma `var(--primary)` (para fondo claro). El punto siempre naranja.
 */

export function Isologo({
  className,
  tile = true,
}: {
  className?: string;
  tile?: boolean;
  /** @deprecated el lettermark es estático; se mantiene por compatibilidad de API */
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      style={tile ? { borderRadius: "22%", background: "var(--primary-2)" } : undefined}
      aria-label="traelo."
    >
      <text
        x="30"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-display"
        style={{ fontWeight: 800, letterSpacing: "-0.05em" }}
        fontSize="46"
        fill={tile ? "#FFFFFF" : "var(--primary)"}
      >
        t<tspan fill="var(--accent)">.</tspan>
      </text>
    </svg>
  );
}
