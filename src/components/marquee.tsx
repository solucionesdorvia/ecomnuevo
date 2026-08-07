import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  "50 KG POR BULTO",
  "HASTA USD 3.000",
  "PRECIO FINAL SIN SORPRESAS",
  "TRACKING PUERTO A PUERTA",
];

function MarqueeRow({ items }: { items: string[] }) {
  return (
    <div className="traelo-marquee flex shrink-0 items-center gap-8 pr-8 font-mono-ui text-sm font-bold text-primary">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap">
          {it}
          <span aria-hidden="true">·</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Franja naranja con los datos duros del régimen courier, en Space Mono.
 * Scrollea en loop infinito (el contenido va duplicado para el bucle sin corte).
 */
export function Marquee({ items = DEFAULT_ITEMS, className }: { items?: string[]; className?: string }) {
  return (
    <div className={cn("flex overflow-hidden bg-accent py-3.5", className)} aria-label="Datos del envío">
      <MarqueeRow items={items} />
      <MarqueeRow items={items} />
    </div>
  );
}
