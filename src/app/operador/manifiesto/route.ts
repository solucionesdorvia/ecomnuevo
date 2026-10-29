import type { LogisticState } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDocumento } from "@/lib/documento";
import { FLOW } from "@/lib/estados";
import { orderCode } from "@/lib/format";

// Parte de envío para el depósito / el transporte desde origen: una fila por
// pedido con lo que necesitan para consolidar y despachar (consignatario,
// documento, dirección, contenido, peso y valor FOB). CSV con BOM y `;` para
// que Excel en castellano lo abra directo.
export async function GET(req: Request) {
  await requireRole("OPERADOR", "ADMIN");
  const param = new URL(req.url).searchParams.get("estado") ?? "RECIBIDO_DEPOSITO_EXTERIOR";
  const estado = (FLOW as string[]).includes(param) ? (param as LogisticState) : "RECIBIDO_DEPOSITO_EXTERIOR";

  const orders = await db.order.findMany({
    where: { paymentStatus: "PAGADO", state: estado },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { supplier: true } }, variant: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Pedido",
    "Código",
    "Fecha",
    "Consignatario",
    "Tipo doc",
    "Documento",
    "Email",
    "Teléfono",
    "Dirección",
    "Localidad",
    "Provincia",
    "CP",
    "Contenido",
    "Unidades",
    "Peso kg",
    "Valor FOB USD",
    "Total cobrado USD",
    "Proveedores",
    "Depósito",
  ];
  const rows = orders.map((o) => {
    const suppliers = [...new Map(o.items.map((i) => [i.product.supplier.id, i.product.supplier])).values()];
    return [
      o.number,
      orderCode(o.number),
      o.createdAt.toISOString().slice(0, 10),
      o.user.name,
      o.docType,
      formatDocumento(o.docType, o.docNumber),
      o.user.email,
      o.address.phone,
      o.address.street + (o.address.apartment ? `, ${o.address.apartment}` : ""),
      o.address.city,
      o.address.province,
      o.address.zipCode,
      o.items.map((i) => `${i.quantity}x ${i.product.title}${i.variant ? ` (${i.variant.value})` : ""}`).join(" | "),
      o.items.reduce((a, i) => a + i.quantity, 0),
      o.totalWeightKg.toNumber().toFixed(3).replace(".", ","),
      o.items
        .reduce((a, i) => a + i.product.costUsd.toNumber() * i.quantity, 0)
        .toFixed(2)
        .replace(".", ","),
      o.totalUsd.toNumber().toFixed(2).replace(".", ","),
      suppliers.map((s) => s.name).join(" | "),
      [...new Set(suppliers.map((s) => `${s.depot} (${s.country})`))].join(" | "),
    ];
  });

  const cell = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="parte-envio-${estado.toLowerCase()}-${fecha}.csv"`,
    },
  });
}
