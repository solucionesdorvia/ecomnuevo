import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/product-form";

export const metadata: Metadata = { title: "Nuevo producto — Admin" };

export default async function NuevoProductoPage() {
  const suppliers = await db.supplier.findMany({
    where: { active: true },
    select: { id: true, name: true, country: true },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-[-0.02em]">Nuevo producto</h1>
      <ProductForm suppliers={suppliers} />
    </div>
  );
}
