import { Check, Circle, X } from "lucide-react";
import type { LogisticState } from "@prisma/client";
import { FLOW, STATE_DESCRIPTION, STATE_LABEL } from "@/lib/estados";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  toState: LogisticState;
  createdAt: Date;
  note?: string | null;
};

/** Timeline vertical del pedido: pasos del flujo + fecha real de cada evento. */
export function OrderTimeline({
  currentState,
  events,
}: {
  currentState: LogisticState;
  events: TimelineEvent[];
}) {
  const cancelled = currentState === "CANCELADO";
  const reachedIdx = cancelled
    ? FLOW.indexOf(events.filter((e) => e.toState !== "CANCELADO").at(-1)?.toState ?? "PAGADO")
    : FLOW.indexOf(currentState);
  const eventFor = (state: LogisticState) => events.find((e) => e.toState === state);

  const steps: LogisticState[] = cancelled ? [...FLOW.slice(0, reachedIdx + 1), "CANCELADO"] : FLOW;

  return (
    <ol className="flex flex-col">
      {steps.map((state, i) => {
        const event = eventFor(state);
        const isCancel = state === "CANCELADO";
        const done = isCancel ? true : i <= reachedIdx;
        const isCurrent = state === currentState;
        const isLast = i === steps.length - 1;
        return (
          <li key={state} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-0.5",
                  done && !isCurrent ? "bg-success/50" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                isCancel
                  ? "border-red-500 bg-red-500 text-white"
                  : done
                    ? "border-success bg-success text-white"
                    : "border-border bg-surface text-muted",
              )}
            >
              {isCancel ? <X className="size-3.5" /> : done ? <Check className="size-3.5" /> : <Circle className="size-2" />}
            </span>
            <div className={cn("-mt-0.5", !done && "opacity-50")}>
              <p className={cn("text-sm font-medium", isCurrent && !isCancel && "text-success", isCancel && "text-red-600")}>
                {STATE_LABEL[state]}
              </p>
              {event ? (
                <>
                  <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                  {isCurrent && <p className="mt-1 max-w-md text-xs text-muted">{STATE_DESCRIPTION[state]}</p>}
                  {event.note && state !== "PAGADO" && (
                    <p className="mt-1 max-w-md text-xs italic text-muted">“{event.note}”</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted">Pendiente</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
