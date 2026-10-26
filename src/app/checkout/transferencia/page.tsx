import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Landmark, MessageCircle, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatUsd } from "@/lib/format";
import { getTransferConfig, arsAmount } from "@/lib/transfer";

export const metadata: Metadata = { title: "Transferí para completar tu pedido" };

function formatArs(n: number) {
  return "$ " + n.toLocaleString("es-AR");
}

export default async function TransferenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const user = await requireUser("/mis-pedidos");
  const { pedido } = await searchParams;
  if (!pedido) redirect("/mis-pedidos");
  const order = await db.order.findFirst({ where: { id: pedido, userId: user.id } });
  if (!order) notFound();

  const totalUsd = order.totalUsd.toNumber();
  const cfg = getTransferConfig();
  const ars = arsAmount(totalUsd, cfg.arsRate);
  const ref = `TRAELO-${order.number}`;
  const waText = encodeURIComponent(
    `Hola! Transferí el pedido ${ref} de Traelo. Adjunto el comprobante.`,
  );

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="mb-6">
        <span className="eyebrow text-muted">PEDIDO #{order.number} · FALTA EL PAGO</span>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.03em]">
          Transferí para que zarpe
        </h1>
        <p className="mt-2 text-sm text-muted">
          Tu pedido quedó reservado. En cuanto confirmemos la transferencia, empezamos a comprarlo
          afuera y te avisamos por mail en cada paso.
        </p>
      </div>

      {/* Monto */}
      <div className="rounded-2xl bg-primary p-5 text-white">
        <span className="font-mono-ui text-[11px] uppercase tracking-wide text-celeste">
          Monto a transferir
        </span>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-4xl font-extrabold tracking-[-0.03em] text-accent">
            {formatUsd(totalUsd)}
          </span>
          {ars != null && (
            <span className="font-display text-2xl font-bold text-white">o {formatArs(ars)}</span>
          )}
        </div>
        {ars != null ? (
          <p className="mt-1 font-mono-ui text-[11px] text-celeste-soft">
            cotización de hoy: $ {cfg.arsRate.toLocaleString("es-AR")} / US$1
          </p>
        ) : (
          <p className="mt-1 font-mono-ui text-[11px] text-celeste-soft">
            transferís el equivalente en pesos a la cotización del día
          </p>
        )}
      </div>

      {/* Referencia */}
      <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
        <p className="text-sm">
          <b>Importante:</b> poné este código en el concepto/referencia de la transferencia así la
          identificamos:
        </p>
        <p className="mt-2 select-all font-mono-ui text-lg font-bold text-primary">{ref}</p>
      </div>

      {/* Cuentas */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold">
          {cfg.cuentas.length > 1 ? "Transferí a cualquiera de estas cuentas" : "Datos de la cuenta"}
        </h2>

        {cfg.cuentas.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            Los datos de la cuenta todavía no están cargados. Escribinos y te los pasamos para
            completar el pago de este pedido ({ref}).
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cfg.cuentas.map((c) => (
              <div key={c.moneda} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Landmark className="size-4 text-primary" />
                  <span className="font-semibold">
                    En {c.moneda === "ARS" ? "pesos" : "dólares"}
                  </span>
                  <span className="ml-auto font-display text-lg font-extrabold text-accent">
                    {c.moneda === "ARS"
                      ? ars != null
                        ? formatArs(ars)
                        : "a cotización"
                      : formatUsd(totalUsd)}
                  </span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {c.titular && (
                    <>
                      <dt className="text-muted">Titular</dt>
                      <dd className="select-all">{c.titular}</dd>
                    </>
                  )}
                  {c.banco && (
                    <>
                      <dt className="text-muted">Banco</dt>
                      <dd className="select-all">{c.banco}</dd>
                    </>
                  )}
                  {c.alias && (
                    <>
                      <dt className="text-muted">Alias</dt>
                      <dd className="select-all font-mono-ui">{c.alias}</dd>
                    </>
                  )}
                  {c.cbu && (
                    <>
                      <dt className="text-muted">CBU</dt>
                      <dd className="select-all font-mono-ui">{c.cbu}</dd>
                    </>
                  )}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comprobante */}
      {cfg.whatsapp && (
        <a
          href={`https://wa.me/${cfg.whatsapp}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-success px-6 py-3.5 font-bold text-white hover:opacity-90"
        >
          <MessageCircle className="size-5" /> Enviar comprobante por WhatsApp
        </a>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck className="size-3.5" /> En cuanto confirmemos la transferencia, el pedido pasa a
        &ldquo;pagado&rdquo; y arranca el viaje.
      </p>

      <div className="mt-6 flex justify-center">
        <Link
          href={`/mis-pedidos/${order.id}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Ver el estado de mi pedido →
        </Link>
      </div>
    </div>
  );
}
