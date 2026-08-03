import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/categorias";
import { formatKg, formatUsd } from "@/lib/format";
import { toggleProductActive } from "@/actions/admin";

export const metadata: Metadata = { title: "Productos — Admin" };

export default async function AdminProductosPage() {
  const products = await db.product.findMany({
    include: { supplier: { select: { name: true, country: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos ({products.length})</h1>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="size-4" /> Nuevo producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Peso</th>
              <th className="px-4 py-3">Precio final</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                    <Link href={`/admin/productos/${p.id}`} className="max-w-xs truncate font-medium text-primary hover:underline">
                      {p.title}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2 text-muted">{CATEGORY_LABEL[p.category]}</td>
                <td className="px-4 py-2 text-muted">
                  {p.supplier.name} <span className="text-xs">({p.supplier.country})</span>
                </td>
                <td className="px-4 py-2 tabular-nums text-muted">{formatKg(p.weightKg)}</td>
                <td className="px-4 py-2 tabular-nums">{formatUsd(p.priceUsd)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-success/15 text-success" : "bg-border text-muted"}`}>
                    {p.active ? "Activo" : "Pausado"}
                  </span>
                  {p.featured && (
                    <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      Destacado
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await toggleProductActive(p.id);
                    }}
                  >
                    <button className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
                      {p.active ? "Pausar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
