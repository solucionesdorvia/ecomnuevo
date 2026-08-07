import { Check } from "lucide-react";
import type { LogisticState } from "@prisma/client";
import { FLOW } from "@/lib/estados";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Etiquetas cortas del diseño para el stepper (las largas van en la bitácora).
const SHORT: Record<string, string> = {
  PAGADO: "PAGADA",
  COMPRADO_EN_ORIGEN: "COMPRADA",
  RECIBIDO_DEPOSITO_EXTERIOR: "EN DEPÓSITO",
  EMBARCADO: "EMBARCADA",
  EN_ADUANA: "EN ADUANA",
  ENTREGADO: "EN TU PUERTA",
};

/**
 * Stepper horizontal de 6 estados (diseño "traelo. v1"): línea naranja hasta el
 * estado actual, nodos completados en naranja, el actual como anillo, futuros
 * tenues. Sobre fondo tinta oceánica. Va con fechas cuando hay evento.
 */
export function OrderProgress({
  currentState,
  events,
}: {
  currentState: LogisticState;
  events: { toState: LogisticState; createdAt: Date }[];
}) {
  const reachedIdx = FLOW.indexOf(currentState === "CANCELADO" ? "PAGADO" : currentState);
  const pct = FLOW.length > 1 ? (reachedIdx / (FLOW.length - 1)) * 100 : 0;
  const dateFor = (s: LogisticState) => events.find((e) => e.toState === s)?.createdAt;

  return (
    <div className="relative">
      {/* riel */}
      <div className="absolute left-[10px] right-[10px] top-[9px] h-0.5 bg-celeste/25 sm:top-[15px]" />
      <div
        className="absolute left-[10px] top-[9px] h-0.5 bg-accent transition-all sm:top-[15px]"
        style={{ width: `calc(${pct}% - ${(pct / 100) * 20}px)` }}
      />
      <ol className="relative flex justify-between">
        {FLOW.map((state, i) => {
          const done = i < reachedIdx;
          const current = i === reachedIdx && currentState !== "CANCELADO";
          const date = dateFor(state);
          return (
            <li key={state} className="flex w-[15%] min-w-0 flex-col items-center text-center">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full sm:size-8",
                  current
                    ? "border-[3px] border-accent bg-primary sm:border-[5px]"
                    : done
                      ? "bg-accent text-white"
                      : "border-2 border-celeste/40 bg-primary",
                )}
              >
                {done && <Check className="size-3 sm:size-4" />}
              </span>
              <span
                className={cn(
                  "mt-2 font-mono-ui text-[9px] leading-tight sm:text-[11px]",
                  current ? "font-bold text-accent" : done ? "text-white" : "text-white/45",
                )}
              >
                {SHORT[state]}
              </span>
              <span className="mt-1 hidden font-mono-ui text-[10px] text-celeste/70 sm:block">
                {date ? formatDate(date).replace(/ de \d{4}/, "").toUpperCase() : "—"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
