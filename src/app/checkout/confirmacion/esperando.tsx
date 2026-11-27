"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_INTENTOS = 15; // ~45 s

/**
 * El banco todavía no contestó: vuelve a consultar cada 3 s. Si tarda más,
 * el pedido queda pendiente y se confirma solo cuando llega el aviso de la
 * pasarela (webhook); el cliente lo ve en Mis pedidos.
 */
export function Esperando({ orderId, intento }: { orderId: string; intento: number }) {
  const router = useRouter();
  const sigue = intento < MAX_INTENTOS;

  useEffect(() => {
    if (!sigue) return;
    const t = setTimeout(
      () => router.replace(`/checkout/confirmacion?pedido=${encodeURIComponent(orderId)}&intento=${intento + 1}`),
      3000,
    );
    return () => clearTimeout(t);
  }, [sigue, intento, orderId, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      {sigue ? (
        <>
          <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-hidden />
          <p className="text-lg font-medium">Esperando la confirmación del banco…</p>
          <p className="text-sm text-muted">No cierres esta página, tarda unos segundos.</p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium">Tu pago está en revisión</p>
          <p className="text-sm text-muted">
            El banco todavía no lo confirmó. Apenas lo haga, el pedido arranca solo y te avisamos por mail.
          </p>
          <Link href="/mis-pedidos" className="mt-2 font-semibold text-accent hover:underline">
            Ver mis pedidos →
          </Link>
        </>
      )}
    </div>
  );
}
