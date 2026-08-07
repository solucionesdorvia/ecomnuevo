import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { supplierSlug } from "@/lib/fabricas";
import { CATEGORY_LABEL } from "@/lib/categorias";
import { SupplierAvatar } from "@/components/supplier-avatar";

export const metadata: Metadata = {
  title: "Fábricas y proveedores",
  description:
    "De dónde viene lo que comprás. Trabajamos directo con estas fábricas y depósitos del exterior — sin intermediarios.",
};

function avatarSrc(name: string): string | null {
  const rel = `fabricas/${supplierSlug(name)}-avatar.png`;
  return existsSync(join(process.cwd(), "public", rel)) ? `/${rel}` : null;
}

export default async function FabricasPage() {
  const [suppliers, catGroups] = await Promise.all([
    db.supplier.findMany({
      where: { active: true },
      include: { _count: { select: { products: { where: { active: true } } } } },
      orderBy: { name: "asc" },
    }),
    db.product.groupBy({ by: ["supplierId", "category"], where: { active: true }, _count: true }),
  ]);

  // Categorías cubiertas por cada fábrica (ordenadas por cantidad)
  const catsBySupplier = new Map<string, Category[]>();
  for (const g of [...catGroups].sort((a, b) => b._count - a._count)) {
    const arr = catsBySupplier.get(g.supplierId) ?? [];
    arr.push(g.category as Category);
    catsBySupplier.set(g.supplierId, arr);
  }

  return (
    <div className="py-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Transparencia</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          De dónde viene lo que comprás.
        </h1>
        <p className="mt-3 text-lg text-muted">
          Compramos directo a estas fábricas y depósitos del exterior. Sin intermediarios,
          sin cadena de reventa: por eso el precio baja y sabés exactamente de dónde sale tu pedido.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => {
          const cats = catsBySupplier.get(s.id) ?? [];
          return (
            <Link
              key={s.id}
              href={`/fabricas/${s.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-celeste hover:shadow-md"
            >
              <div className="relative h-24 w-full bg-primary">
                <Image
                  src={`/fabricas/${supplierSlug(s.name)}-cover.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 384px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                <div className="flex items-center gap-3">
                  <SupplierAvatar
                    name={s.name}
                    src={avatarSrc(s.name)}
                    className="-mt-8 size-16 border-4 border-surface"
                    textClassName="text-lg"
                  />
                  <div className="min-w-0 pt-1">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted">
                      <MapPin className="size-3.5 shrink-0" /> {s.country}
                    </p>
                  </div>
                </div>
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted"
                      >
                        {CATEGORY_LABEL[c]}
                      </span>
                    ))}
                  </div>
                )}
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <BadgeCheck className="size-4 shrink-0" /> Proveedor verificado por Traelo
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted">
                    {s._count.products} {s._count.products === 1 ? "producto" : "productos"}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    Ver catálogo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
