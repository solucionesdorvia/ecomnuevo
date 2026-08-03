import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Único componente que renderiza precios de cara al cliente: siempre el final. */
export function Price({
  value,
  className,
  final = true,
}: {
  value: number | string | { toNumber(): number };
  className?: string;
  /** si es el precio final al cliente va en coral */
  final?: boolean;
}) {
  return (
    <span data-price className={cn("tabular-nums font-semibold", final && "text-accent", className)}>
      {formatUsd(value)}
    </span>
  );
}
