import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Proveedores — Admin" };

export default async function AdminProveedoresPage() {
  const suppliers = await db.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores ({suppliers.length})</h1>
        <Link
          href="/admin/proveedores/nuevo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="size-4" /> Nuevo proveedor
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Depósito</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link href={`/admin/proveedores/${s.id}`} className="font-medium text-primary hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{s.country}</td>
                <td className="px-4 py-3 text-muted">{s.depot}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{s._count.products}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? "bg-success/15 text-success" : "bg-border text-muted"}`}>
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
