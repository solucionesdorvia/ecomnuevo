import type { LogisticState } from "@prisma/client";

// Orden canónico del flujo logístico
export const FLOW: LogisticState[] = [
  "PAGADO",
  "COMPRADO_EN_ORIGEN",
  "RECIBIDO_DEPOSITO_EXTERIOR",
  "EMBARCADO",
  "EN_ADUANA",
  "ENTREGADO",
];

export const STATE_LABEL: Record<LogisticState, string> = {
  PAGADO: "Pagado",
  COMPRADO_EN_ORIGEN: "Comprado en origen",
  RECIBIDO_DEPOSITO_EXTERIOR: "Recibido en depósito exterior",
  EMBARCADO: "Embarcado",
  EN_ADUANA: "En Aduana",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const STATE_DESCRIPTION: Record<LogisticState, string> = {
  PAGADO: "Recibimos tu pago. Estamos gestionando la compra con el proveedor.",
  COMPRADO_EN_ORIGEN: "Compramos tu producto al proveedor del exterior.",
  RECIBIDO_DEPOSITO_EXTERIOR: "Tu producto llegó a nuestro depósito en origen.",
  EMBARCADO: "Tu pedido viaja en barco hacia Argentina.",
  EN_ADUANA: "Tu pedido está en la Aduana argentina, a tu nombre.",
  ENTREGADO: "Tu pedido fue entregado. ¡Gracias por comprar!",
  CANCELADO: "El pedido fue cancelado.",
};

/**
 * Transiciones válidas. Solo se avanza de a un paso en el flujo;
 * CANCELADO es alcanzable desde cualquier estado previo a EMBARCADO.
 */
export function validNextStates(current: LogisticState): LogisticState[] {
  if (current === "ENTREGADO" || current === "CANCELADO") return [];
  const idx = FLOW.indexOf(current);
  const next: LogisticState[] = idx >= 0 && idx < FLOW.length - 1 ? [FLOW[idx + 1]] : [];
  const beforeShipped = FLOW.indexOf(current) < FLOW.indexOf("EMBARCADO");
  return beforeShipped ? [...next, "CANCELADO"] : next;
}

export function isValidTransition(from: LogisticState, to: LogisticState): boolean {
  return validNextStates(from).includes(to);
}
