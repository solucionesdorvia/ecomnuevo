import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Price } from "@/components/price";
import { StateBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function MisPedidosPage() {
  const user = await requireUser("/mis-pedidos");
  const orders = await db.order.findMany({
    where: { userId: user.id, paymentStatus: { in: ["PAGADO", "REEMBOLSADO"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-semibold">Mis pedidos</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Package className="size-12 text-muted/50" />
          <p className="font-medium">Todavía no tenés pedidos.</p>
          <Link
            href="/catalogo"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Ver el catálogo
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/mis-pedidos/${order.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className="relative block size-12 overflow-hidden rounded-lg border-2 border-surface bg-white"
                    >
                      <Image src={item.product.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">Pedido #{order.number}</p>
                    <StateBadge state={order.state} />
                  </div>
                  <p className="truncate text-sm text-muted">
                    {formatDate(order.createdAt)} · {order.items.reduce((a, i) => a + i.quantity, 0)}{" "}
                    {order.items.length === 1 && order.items[0].quantity === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <Price value={order.totalUsd} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
