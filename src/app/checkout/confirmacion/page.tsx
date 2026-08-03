import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmOrderPayment } from "@/lib/orders";
import { Finisher } from "./finisher";

export const metadata: Metadata = { title: "Confirmando tu pago" };

// Vuelta de un procesador de pagos EXTERNO (ej. Stripe). Confirma el pago
// contra el procesador (nunca se confía en el redirect solo) y delega el
// cierre (vaciar carrito + ir a "mis pedidos") a una server action.
export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;
  if (!pedido) redirect("/");

  const result = await confirmOrderPayment(pedido);
  if (!result.ok) redirect("/checkout?error=pago");

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-lg font-medium">Confirmando tu pago…</p>
      <Finisher orderId={pedido} />
    </div>
  );
}
