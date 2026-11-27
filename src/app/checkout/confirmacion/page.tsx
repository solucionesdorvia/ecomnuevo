import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmOrderPayment } from "@/lib/orders";
import { Finisher } from "./finisher";
import { Esperando } from "./esperando";

export const metadata: Metadata = { title: "Confirmando tu pago" };

// Vuelta de un procesador de pagos EXTERNO (ej. Stripe). Confirma el pago
// contra el procesador (nunca se confía en el redirect solo) y delega el
// cierre (vaciar carrito + ir a "mis pedidos") a una server action.
// Solo para el dueño: un pago rechazado deja el pedido FALLIDO, y eso no lo
// puede disparar un tercero que tenga el link.
export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string; intento?: string }>;
}) {
  const { pedido, intento } = await searchParams;
  if (!pedido) redirect("/");

  const user = await requireUser(`/checkout/confirmacion?pedido=${encodeURIComponent(pedido)}`);
  const order = await db.order.findFirst({ where: { id: pedido, userId: user.id }, select: { id: true } });
  if (!order) notFound();

  // Si la pasarela no responde (red, caída momentánea) se trata como pendiente:
  // el webhook igual confirma el pedido cuando Getnet avise.
  const result = await confirmOrderPayment(pedido).catch((e) => {
    console.error("[confirmacion] no se pudo consultar el pago:", e);
    return { ok: false, pending: true };
  });
  // La pasarela todavía no informó el resultado: se reintenta unos segundos.
  if (result.pending) return <Esperando orderId={pedido} intento={Number(intento ?? 0) || 0} />;
  if (!result.ok) redirect("/checkout?error=pago");

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-lg font-medium">Confirmando tu pago…</p>
      <Finisher orderId={pedido} />
    </div>
  );
}
