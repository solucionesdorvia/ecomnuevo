"use client";

import { useActionState, useState } from "react";
import type { LogisticState } from "@prisma/client";
import { advanceState, type AdvanceState } from "@/actions/operador";
import { STATE_LABEL } from "@/lib/estados";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";

export function AdvanceStateForm({
  orderId,
  nextStates,
}: {
  orderId: string;
  nextStates: LogisticState[];
}) {
  const [state, formAction, pending] = useActionState<AdvanceState, FormData>(advanceState, {});
  const [toState, setToState] = useState<string>(nextStates[0] ?? "");
  const cancelling = toState === "CANCELADO";

  if (nextStates.length === 0) {
    return <p className="text-sm text-muted">Este pedido llegó a un estado final: no hay más transiciones.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <Label htmlFor="toState">Avanzar a</Label>
        <Select id="toState" name="toState" value={toState} onChange={(e) => setToState(e.target.value)}>
          {nextStates.map((s) => (
            <option key={s} value={s}>
              {STATE_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="note">
          {cancelling ? "Motivo de la cancelación (obligatorio)" : "Nota para el cliente (opcional)"}
        </Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          required={cancelling}
          placeholder={
            cancelling
              ? "Ej.: el proveedor discontinuó el modelo; se reembolsa el pago."
              : "Ej.: número de tracking del proveedor, demora estimada…"
          }
        />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state.ok && !pending && (
        <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
          Estado actualizado. Se le avisó al cliente por email.
        </p>
      )}
      <Button type="submit" variant={cancelling ? "danger" : "primary"} disabled={pending}>
        {pending ? "Guardando…" : cancelling ? "Cancelar el pedido" : "Confirmar avance"}
      </Button>
    </form>
  );
}
