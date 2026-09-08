import type { LogisticState } from "@prisma/client";
import { STATE_DESCRIPTION, STATE_LABEL } from "@/lib/estados";
import { formatUsd } from "@/lib/format";
import type { Mail } from "./index";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Estado → GIF branded (en public/animations/estados/). El GIF ya trae fondo claro.
const STATE_GIF: Partial<Record<LogisticState, string>> = {
  PAGADO: "pagado",
  COMPRADO_EN_ORIGEN: "comprado",
  RECIBIDO_DEPOSITO_EXTERIOR: "deposito",
  EMBARCADO: "embarcado",
  EN_ADUANA: "aduana",
  ENTREGADO: "entregado",
};

// ── Layout HTML email-safe (tablas + estilos inline; sin fuentes externas) ──
function emailLayout(a: {
  gif: string;
  eyebrow: string;
  heading: string;
  body: string;
  summary?: { k: string; v: string }[];
  ctaLabel: string;
  ctaUrl: string;
  reassure?: string;
}): string {
  const summaryRows = (a.summary ?? [])
    .map(
      (s, i, arr) =>
        `<tr><td style="padding:12px 0;${i < arr.length - 1 ? "border-bottom:1px solid #E2E7E5;" : ""}"><span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#5E7183;">${s.k}</span></td><td align="right" style="padding:12px 0;${i < arr.length - 1 ? "border-bottom:1px solid #E2E7E5;" : ""}"><span style="font-weight:700;font-size:15px;color:#0C2136;">${s.v}</span></td></tr>`,
    )
    .join("");
  const summaryBlock = a.summary?.length
    ? `<tr><td style="padding:0 28px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F2;border:1px solid #E2E7E5;border-radius:12px;padding:2px 18px;"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${summaryRows}</table></td></tr></table></td></tr>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Traelo</title></head>
<body style="margin:0;padding:0;background:#F4F6F2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="background:#0C2136;padding:20px 28px;"><span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-1px;">traelo<span style="color:#FF5A1F;">.</span></span></td></tr>
  <tr><td style="background:#0C2136;padding:2px 28px 32px;text-align:center;">
    <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8FCDEB;">${a.eyebrow}</div>
    <div style="font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-1px;line-height:1.08;margin:12px 0 0;">${a.heading}</div>
    <img src="${a.gif}" alt="" width="200" height="200" style="display:block;margin:24px auto 0;border-radius:18px;background:#eef7fd;border:0;outline:0;" />
    <div style="font-size:15px;color:#BFE2F2;line-height:1.5;margin:20px auto 0;max-width:420px;">${a.body}</div>
  </td></tr>
  ${summaryBlock}
  <tr><td style="padding:26px 28px 6px;text-align:center;"><a href="${a.ctaUrl}" style="display:inline-block;background:#FF5A1F;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:15px 34px;border-radius:10px;">${a.ctaLabel}</a></td></tr>
  ${a.reassure ? `<tr><td style="padding:14px 28px 22px;text-align:center;color:#5E7183;font-size:13px;line-height:1.5;">${a.reassure}</td></tr>` : `<tr><td style="height:22px;"></td></tr>`}
  <tr><td style="background:#0C2136;padding:24px 28px 28px;">
    <div style="font-size:19px;font-weight:800;color:#ffffff;letter-spacing:-1px;">traelo<span style="color:#FF5A1F;">.</span></div>
    <div style="font-size:12px;line-height:1.6;color:#9DB4C6;margin-top:10px;">Comprás directo de fábrica, con precio final sin sorpresas. Tu compra viaja en barco y entra al país a tu nombre, bajo régimen courier (hasta 50 kg y US$ 3.000 por pedido).</div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export function paymentConfirmedMail(args: {
  to: string;
  name: string;
  orderNumber: number;
  totalUsd: number;
}): Mail {
  return {
    to: args.to,
    subject: `Pedido #${args.orderNumber} confirmado — Traelo`,
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
      "Traelo",
    ].join("\n"),
    html: emailLayout({
      gif: `${appUrl()}/animations/estados/pagado.gif`,
      eyebrow: `Pedido #${args.orderNumber}`,
      heading: "¡Pago recibido!",
      body: `Hola ${args.name}, recibimos tu pago. Vamos a comprarlo al proveedor del exterior y te avisamos en cada paso. Tu compra viaja en barco: 45 a 60 días.`,
      summary: [{ k: "Total pagado", v: formatUsd(args.totalUsd) }],
      ctaLabel: "Seguí tu pedido →",
      ctaUrl: `${appUrl()}/mis-pedidos`,
      reassure: "Precio final: no hay nada más que pagar al recibir.",
    }),
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
  lines.push("", `Ver el detalle: ${appUrl()}/mis-pedidos`, "", "Traelo");
  const gifName = STATE_GIF[args.newState];
  return {
    to: args.to,
    subject: `Pedido #${args.orderNumber}: ${STATE_LABEL[args.newState]} — Traelo`,
    text: lines.join("\n"),
    html: emailLayout({
      gif: `${appUrl()}/animations/estados/${gifName ?? "embarcado"}.gif`,
      eyebrow: `Pedido #${args.orderNumber}`,
      heading: STATE_LABEL[args.newState],
      body:
        STATE_DESCRIPTION[args.newState] +
        (args.note ? `<br><br><span style="color:#8FCDEB;">Nota del equipo: ${args.note}</span>` : ""),
      ctaLabel: "Ver el detalle →",
      ctaUrl: `${appUrl()}/mis-pedidos`,
      reassure: "Te avisamos por acá en cada movimiento.",
    }),
  };
}

export function passwordResetMail(args: { to: string; name: string; token: string }): Mail {
  return {
    to: args.to,
    subject: "Recuperá tu contraseña — Traelo",
    text: [
      `Hola ${args.name},`,
      "",
      "Pediste restablecer tu contraseña. Entrá a este link (vence en 1 hora):",
      `${appUrl()}/recuperar/${args.token}`,
      "",
      "Si no fuiste vos, ignorá este email.",
      "",
      "Traelo",
    ].join("\n"),
  };
}
