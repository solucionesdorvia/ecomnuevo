import type { LogisticState } from "@prisma/client";
import { STATE_LABEL } from "@/lib/estados";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

const STATE_STYLE: Record<LogisticState, string> = {
  PAGADO: "bg-primary/10 text-primary",
  COMPRADO_EN_ORIGEN: "bg-amber-100 text-amber-800",
  RECIBIDO_DEPOSITO_EXTERIOR: "bg-amber-100 text-amber-800",
  EMBARCADO: "bg-sky-100 text-sky-800",
  EN_ADUANA: "bg-violet-100 text-violet-800",
  ENTREGADO: "bg-success/15 text-success",
  CANCELADO: "bg-red-100 text-red-700",
};

export function StateBadge({ state, className }: { state: LogisticState; className?: string }) {
  return <Badge className={cn(STATE_STYLE[state], className)}>{STATE_LABEL[state]}</Badge>;
}
