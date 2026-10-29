"use client";

import { useActionState } from "react";
import { confirmTransfer, discardTransfer, type AdvanceState } from "@/actions/operador";
import { formatUsd, orderCode } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

/** Pedido por transferencia sin pago: confirmar que entró, o descartarlo si nunca llegó. */
export function TransferPendingPanel({
  orderId,
  orderNumber,
  totalUsd,
}: {
  orderId: string;
  orderNumber: number;
  totalUsd: number;
}) {
  const [state, discardAction, pending] = useActionState<AdvanceState, FormData>(discardTransfer, {});

  return (
    <div className="flex flex-col gap-3">
      <form action={confirmTransfer} className="flex flex-col gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <p className="text-sm text-muted">
          Pago por <b>transferencia</b>, pendiente. Confirmá cuando verifiques en el banco que entraron{" "}
          <b>{formatUsd(totalUsd)}</b> (o su equivalente en pesos) con referencia{" "}
          <b className="font-mono-ui">{orderCode(orderNumber)}</b>.
        </p>
        <button className="h-11 w-full cursor-pointer rounded-lg bg-success font-medium text-white hover:opacity-90">
          Confirmar pago recibido
        </button>
      </form>

      <details className="rounded-lg border border-border p-3 text-sm">
        <summary className="cursor-pointer text-muted">La transferencia no llegó</summary>
        <form action={discardAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <Label htmlFor="reason">Motivo (obligatorio)</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={2}
            required
            placeholder="Ej.: pasaron 72 h sin comprobante; el cliente pidió anularlo."
          />
          {state.error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{state.error}</p>}
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? "Descartando…" : "Descartar pedido"}
          </Button>
        </form>
      </details>
    </div>
  );
}
