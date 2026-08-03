import type { LogisticState } from "@prisma/client";
import { STATE_DESCRIPTION, STATE_LABEL } from "@/lib/estados";
import { formatUsd } from "@/lib/format";
import type { Mail } from "./index";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function paymentConfirmedMail(args: {
  to: string;
  name: string;
  orderNumber: number;
  totalUsd: number;
}): Mail {
  return {
    to: args.to,
    subject: `Pedido #${args.orderNumber} confirmado — Ecomex Market`,
    text: [
      `Hola ${args.name},`,
      "",
      `Recibimos tu pago de ${formatUsd(args.totalUsd)}. Tu pedido #${args.orderNumber} ya está en manos del equipo:`,
      "vamos a comprarlo al proveedor del exterior y te avisamos en cada paso.",
      "",
      "Recordá que tu compra viaja en barco: el tiempo estimado de entrega es de 45 a 60 días.",
      "El precio que pagaste es final — no vas a tener que pagar nada más al recibirlo.",
      "",
      `Seguí tu pedido en ${appUrl()}/mis-pedidos`,
      "",
      "Ecomex Market",
    ].join("\n"),
  };
}

export function stateChangedMail(args: {
  to: string;
  name: string;
  orderNumber: number;
  newState: LogisticState;
  note?: string | null;
}): Mail {
  const lines = [
    `Hola ${args.name},`,
    "",
    `Tu pedido #${args.orderNumber} cambió de estado: ${STATE_LABEL[args.newState]}.`,
    STATE_DESCRIPTION[args.newState],
  ];
  if (args.note) lines.push("", `Nota del equipo: ${args.note}`);
  lines.push("", `Ver el detalle: ${appUrl()}/mis-pedidos`, "", "Ecomex Market");
  return {
    to: args.to,
    subject: `Pedido #${args.orderNumber}: ${STATE_LABEL[args.newState]} — Ecomex Market`,
    text: lines.join("\n"),
  };
}

export function passwordResetMail(args: { to: string; name: string; token: string }): Mail {
  return {
    to: args.to,
    subject: "Recuperá tu contraseña — Ecomex Market",
    text: [
      `Hola ${args.name},`,
      "",
      "Pediste restablecer tu contraseña. Entrá a este link (vence en 1 hora):",
      `${appUrl()}/recuperar/${args.token}`,
      "",
      "Si no fuiste vos, ignorá este email.",
      "",
      "Ecomex Market",
    ].join("\n"),
  };
}
