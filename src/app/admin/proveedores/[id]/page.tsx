import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SupplierForm } from "@/components/supplier-form";

export const metadata: Metadata = { title: "Editar proveedor — Admin" };

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await db.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-[-0.02em]">Editar proveedor</h1>
      <SupplierForm
        supplier={{
          id: supplier.id,
          name: supplier.name,
          country: supplier.country,
          depot: supplier.depot,
          contactUrl: supplier.contactUrl ?? "",
          notes: supplier.notes ?? "",
          active: supplier.active,
        }}
      />
    </div>
  );
}
