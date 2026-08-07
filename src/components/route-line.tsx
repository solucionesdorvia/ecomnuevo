import { cn } from "@/lib/utils";

/**
 * Ruta marítima animada: origen celeste (que pulsa) → línea punteada naranja que
 * fluye → anillo naranja de destino. Con rótulos mono en los extremos. Es el motif
 * central del sistema "traelo. v1" (el único motion). Escala al ancho del contenedor.
 */
export function RouteLine({
  className,
  origin = "SHANGHÁI",
  destination = "TU PUERTA",
  destinationMuted = false,
  animated = true,
}: {
  className?: string;
  origin?: string;
  destination?: string;
  /** destino como "todavía no llegó" (anillo tenue) */
  destinationMuted?: boolean;
  animated?: boolean;
}) {
  const ring = destinationMuted ? "rgba(255,90,31,.45)" : "var(--accent)";
  return (
    <svg viewBox="0 0 620 240" className={cn("block h-auto w-full", className)} aria-hidden="true">
      <circle cx="40" cy="180" r="9" fill="var(--celeste)" />
      <circle
        cx="40"
        cy="180"
        r="20"
        fill="var(--celeste)"
        className={animated ? "traelo-pulse" : undefined}
        style={{ transformOrigin: "40px 180px" }}
      />
      <path
        d="M40 180 C 180 40, 380 20, 560 96"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 13"
        className={animated ? "traelo-dash" : undefined}
      />
      <circle cx="566" cy="99" r="22" fill="none" stroke={ring} strokeWidth="5" />
      <text x="20" y="216" fill="var(--celeste)" fontFamily="var(--font-mono), monospace" fontSize="14" letterSpacing="2">
        {origin}
      </text>
      <text
        x="470"
        y="150"
        fill={destinationMuted ? "rgba(244,246,242,.5)" : "var(--accent)"}
        fontFamily="var(--font-mono), monospace"
        fontSize="14"
        letterSpacing="2"
      >
        {destination}
      </text>
    </svg>
  );
}
