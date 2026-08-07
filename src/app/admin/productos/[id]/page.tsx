import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/product-form";

export const metadata: Metadata = { title: "Editar producto — Admin" };

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, suppliers] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { where: { available: true } } } }),
    db.supplier.findMany({ select: { id: true, name: true, country: true }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const variantKind = product.variants[0]?.kind ?? "";

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-[-0.02em]">Editar producto</h1>
      <ProductForm
        suppliers={suppliers}
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          category: product.category,
          supplierId: product.supplierId,
          images: product.images,
          weightKg: product.weightKg.toNumber(),
          volumeM3: product.volumeM3.toNumber(),
          costUsd: product.costUsd.toNumber(),
          freightUsd: product.freightUsd.toNumber(),
          taxesUsd: product.taxesUsd.toNumber(),
          marginUsd: product.marginUsd.toNumber(),
          priceUsd: product.priceUsd.toNumber(),
          referencePriceUsd: product.referencePriceUsd?.toNumber() ?? null,
          deliveryDaysMin: product.deliveryDaysMin,
          deliveryDaysMax: product.deliveryDaysMax,
          featured: product.featured,
          active: product.active,
          variantKind,
          variantValues: product.variants
            .filter((v) => v.kind === variantKind)
            .map((v) => v.value)
            .join(", "),
        }}
      />
    </div>
  );
}
