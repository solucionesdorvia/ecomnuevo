import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { clearCartCookie } from "@/lib/cart";
import { confirmOrderPayment } from "@/lib/orders";
import { MockProvider } from "@/lib/payments/mock";

export const metadata: Metadata = { title: "Pago de prueba" };

// Pantalla del procesador SIMULADO (solo dev). Reemplaza a la página de pago
// de Stripe/Mercado Pago cuando PAYMENT_PROVIDER=mock. El resultado se
// resuelve acá mismo en server actions: no depende de redirects externos.
export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string; oid?: string; total?: string; order?: string; cancel?: string }>;
}) {
  const { sid, oid, total, order, cancel } = await searchParams;
  if (!sid || !oid || !cancel) redirect("/");

  async function approve() {
    "use server";
    await MockProvider.resolve(sid!, true);
    const result = await confirmOrderPayment(oid!);
    if (!result.ok) redirect("/checkout?error=pago");
    await clearCartCookie();
    redirect(`/mis-pedidos/${oid}?nuevo=1`);
  }
  async function reject() {
    "use server";
    await MockProvider.resolve(sid!, false);
    await confirmOrderPayment(oid!); // deja el pedido como FALLIDO
    redirect("/checkout?error=pago");
  }
  async function cancelPayment() {
    "use server";
    redirect(cancel!);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <CreditCard className="size-7 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Procesador de pago simulado</h1>
        <p className="mt-1 text-sm text-muted">
          Pantalla de desarrollo — acá iría Stripe o Mercado Pago. Pedido #{order} por US$ {total}.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <form action={approve}>
          <button className="h-12 w-full cursor-pointer rounded-lg bg-success font-medium text-white hover:opacity-90">
            Aprobar el pago
          </button>
        </form>
        <form action={reject}>
          <button className="h-12 w-full cursor-pointer rounded-lg bg-red-600 font-medium text-white hover:bg-red-700">
            Rechazar el pago
          </button>
        </form>
        <form action={cancelPayment}>
          <button className="h-12 w-full cursor-pointer rounded-lg border border-border bg-surface font-medium hover:bg-background">
            Volver sin pagar
          </button>
        </form>
      </div>
    </div>
  );
}
