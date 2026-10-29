import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatDocumento } from "@/lib/documento";
import { formatKg, formatUsd, orderCode } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Etiqueta — Operador" };

// Etiqueta de bulto 10×15 cm (formato de impresora térmica). Sale todo del
// pedido; lo que falta definir con Andy (HS code) queda como casillero en blanco
// para completar a mano. El valor declarado es el costo de producto (FOB), sin
// flete, impuestos ni margen.
export default async function EtiquetaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bultos?: string }>;
}) {
  const { id } = await params;
  const { bultos } = await searchParams;
  const total = Math.min(20, Math.max(1, Number(bultos) || 1));

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: { include: { supplier: true } }, variant: true } },
    },
  });
  if (!order || order.paymentStatus !== "PAGADO") notFound();

  const declared = order.items.reduce((a, i) => a + i.product.costUsd.toNumber() * i.quantity, 0);
  const suppliers = [...new Map(order.items.map((i) => [i.product.supplier.id, i.product.supplier])).values()];
  const units = order.items.reduce((a, i) => a + i.quantity, 0);
  const code = orderCode(order.number);

  return (
    <div>
      <style>{`
        @page { size: 100mm 150mm; margin: 0; }
        @media print {
          body * { visibility: hidden; }
          .etiquetas, .etiquetas * { visibility: visible; }
          .etiquetas { position: absolute; left: 0; top: 0; }
          .etiqueta { box-shadow: none !important; margin: 0 !important; break-after: page; }
        }
      `}</style>

      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <Link
          href={`/operador/pedidos/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <ChevronLeft className="size-4" /> Pedido #{order.number}
        </Link>
        <form className="ml-auto flex items-center gap-2 text-sm">
          <label htmlFor="bultos" className="text-muted">
            Bultos
          </label>
          <input
            id="bultos"
            name="bultos"
            type="number"
            min={1}
            max={20}
            defaultValue={total}
            className="h-9 w-16 rounded-lg border border-border bg-surface px-2"
          />
          <button className="h-9 cursor-pointer rounded-lg border border-border bg-surface px-3 hover:bg-background">
            Actualizar
          </button>
        </form>
        <PrintButton />
      </div>

      <div className="etiquetas flex flex-wrap gap-6">
        {Array.from({ length: total }, (_, n) => (
          <article
            key={n}
            className="etiqueta flex h-[150mm] w-[100mm] flex-col overflow-hidden bg-white text-primary shadow-[0_10px_30px_rgba(12,33,54,.15)]"
          >
            {/* Encabezado */}
            <header className="flex items-center justify-between bg-primary px-[5mm] py-[3mm] text-white">
              <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.04em]">
                traelo<span className="text-accent">.</span>
              </span>
              <span className="font-mono-ui text-[8px] uppercase tracking-[0.14em] text-celeste">
                Operado por Ecomex
              </span>
            </header>

            {/* Pedido */}
            <section className="flex items-end justify-between border-b-2 border-primary px-[5mm] py-[3mm]">
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">Pedido · Order</p>
                <p className="font-display text-[34px] font-extrabold leading-none tracking-[-0.03em]">
                  #{order.number}
                </p>
                <p className="mt-1 font-mono-ui text-[12px] font-bold">{code}</p>
              </div>
              <div className="text-right">
                <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">Bulto · Pkg</p>
                <p className="font-display text-[26px] font-extrabold leading-none">
                  {n + 1}/{total}
                </p>
              </div>
            </section>

            {/* Destinatario */}
            <section className="border-b border-primary/30 px-[5mm] py-[3mm]">
              <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">
                Destinatario / importador · Consignee
              </p>
              <p className="mt-1 text-[15px] font-bold leading-tight">{order.user.name}</p>
              <p className="font-mono-ui text-[11px] font-bold">
                {order.docType} {formatDocumento(order.docType, order.docNumber)}
              </p>
              <p className="mt-1 text-[11px] leading-snug">
                {order.address.street}
                {order.address.apartment ? `, ${order.address.apartment}` : ""}
                <br />
                {order.address.city}, {order.address.province} · CP {order.address.zipCode}
                <br />
                Tel {order.address.phone}
              </p>
              <p className="mt-1 font-display text-[13px] font-extrabold tracking-[0.06em]">ARGENTINA</p>
            </section>

            {/* Origen */}
            <section className="grid grid-cols-2 gap-[3mm] border-b border-primary/30 px-[5mm] py-[2.5mm] text-[10px]">
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">Proveedor · Supplier</p>
                <p className="mt-0.5 font-semibold leading-tight">{suppliers.map((s) => s.name).join(" · ")}</p>
              </div>
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">Depósito · Warehouse</p>
                <p className="mt-0.5 font-semibold leading-tight">
                  {[...new Set(suppliers.map((s) => `${s.depot} · ${s.country}`))].join(" / ")}
                </p>
              </div>
            </section>

            {/* Contenido */}
            <section className="min-h-0 flex-1 overflow-hidden px-[5mm] py-[2.5mm]">
              <p className="font-mono-ui text-[8px] uppercase tracking-[0.12em] text-muted">
                Contenido · Contents ({units} u.)
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 text-[10px] leading-tight">
                {order.items.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex gap-1.5">
                    <span className="font-mono-ui font-bold">{i.quantity}×</span>
                    <span className="line-clamp-1">
                      {i.product.title}
                      {i.variant ? ` (${i.variant.value})` : ""}
                    </span>
                  </li>
                ))}
                {order.items.length > 6 && <li className="text-muted">+ {order.items.length - 6} ítems más</li>}
              </ul>
            </section>

            {/* Datos de despacho */}
            <section className="grid grid-cols-3 border-t-2 border-primary text-center">
              <div className="border-r border-primary/30 px-1 py-[2.5mm]">
                <p className="font-mono-ui text-[7px] uppercase tracking-[0.12em] text-muted">Peso · Weight</p>
                <p className="font-display text-[15px] font-extrabold">{formatKg(order.totalWeightKg)}</p>
              </div>
              <div className="border-r border-primary/30 px-1 py-[2.5mm]">
                <p className="font-mono-ui text-[7px] uppercase tracking-[0.12em] text-muted">Valor FOB · Value</p>
                <p className="font-display text-[15px] font-extrabold">{formatUsd(declared)}</p>
              </div>
              <div className="px-1 py-[2.5mm]">
                <p className="font-mono-ui text-[7px] uppercase tracking-[0.12em] text-muted">HS code</p>
                <p className="mx-auto mt-1 h-[5mm] w-[80%] border-b border-dashed border-primary" />
              </div>
            </section>
            <footer className="bg-primary px-[5mm] py-[2mm] font-mono-ui text-[8px] uppercase tracking-[0.12em] text-celeste-soft">
              Courier puerta a puerta · traelo.ar
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
