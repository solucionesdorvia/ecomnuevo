import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft, MapPin, Warehouse } from "lucide-react";
import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { supplierSlug, supplierBio } from "@/lib/fabricas";
import { CATEGORY_BY_KEY, CATEGORY_KEY, CATEGORY_LABEL } from "@/lib/categorias";
import { cn } from "@/lib/utils";
import { SupplierAvatar } from "@/components/supplier-avatar";
import { ProductCard } from "@/components/product-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supplier = await db.supplier.findUnique({ where: { id }, select: { name: true, country: true } });
  if (!supplier) return {};
  return {
    title: `${supplier.name} — Fábricas`,
    description: `Productos que traemos directo de ${supplier.name} (${supplier.country}).`,
  };
}

function avatarSrc(name: string): string | null {
  const slug = supplierSlug(name);
  const rel = `fabricas/${slug}-avatar.png`;
  return existsSync(join(process.cwd(), "public", rel)) ? `/${rel}` : null;
}

export default async function FabricaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { id } = await params;
  const { categoria } = await searchParams;
  const selectedCat = categoria ? CATEGORY_BY_KEY[categoria] : undefined;

  const [supplier, counts, favIds] = await Promise.all([
    db.supplier.findUnique({ where: { id } }),
    db.product.groupBy({ by: ["category"], where: { supplierId: id, active: true }, _count: true }),
    getFavoriteIds(),
  ]);
  if (!supplier || !supplier.active) notFound();

  const products = await db.product.findMany({
    where: { supplierId: id, active: true, ...(selectedCat ? { category: selectedCat } : {}) },
    include: { supplier: { select: { country: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  const total = counts.reduce((a, c) => a + c._count, 0);
  const catCounts = counts
    .map((c) => ({ cat: c.category as Category, n: c._count }))
    .sort((a, b) => b.n - a.n);

  return (
    <div className="py-6">
      <Link href="/fabricas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronLeft className="size-4" /> Todas las fábricas
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative aspect-[16/6] w-full bg-primary sm:aspect-[16/4]">
          <Image
            src={`/fabricas/${supplierSlug(supplier.name)}-cover.jpg`}
            alt=""
            fill
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6 sm:pb-6">
          <SupplierAvatar
            name={supplier.name}
            src={avatarSrc(supplier.name)}
            className="-mt-12 size-24 border-4 border-surface shadow-sm sm:-mt-14"
            textClassName="text-3xl"
          />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">{supplier.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" /> {supplier.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Warehouse className="size-4 shrink-0" /> Sale desde: {supplier.depot}
              </span>
              <span className="flex items-center gap-1.5 text-success">
                <BadgeCheck className="size-4 shrink-0" /> Proveedor verificado
              </span>
            </div>
          </div>
          <div className="text-center sm:pb-1 sm:text-right">
            <p className="font-display text-3xl font-extrabold tabular-nums text-primary">{total}</p>
            <p className="text-sm text-muted">{total === 1 ? "producto" : "productos"}</p>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <p className="max-w-3xl text-sm leading-relaxed text-muted">{supplierBio(supplier.name)}</p>
        </div>
      </div>

      {/* Categorías que cubre esta fábrica (con filtro) */}
      {catCounts.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1 text-muted">Categorías:</span>
          <Link
            href={`/fabricas/${id}`}
            aria-current={!selectedCat ? "page" : undefined}
            className={cn(
              "chip border transition-colors",
              !selectedCat
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            Todas · {total}
          </Link>
          {catCounts.map(({ cat, n }) => {
            const active = selectedCat === cat;
            return (
              <Link
                key={cat}
                href={`/fabricas/${id}?categoria=${CATEGORY_KEY[cat]}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "chip border transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-muted hover:text-foreground",
                )}
              >
                {CATEGORY_LABEL[cat]} · {n}
              </Link>
            );
          })}
        </div>
      )}

      <h2 className="mb-4 mt-6 font-display text-xl font-extrabold tracking-[-0.02em]">
        {selectedCat ? CATEGORY_LABEL[selectedCat] : `Lo que traemos de ${supplier.name}`}
      </h2>
      {products.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Esta fábrica todavía no tiene productos publicados.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              isFav={favIds.has(p.id)}
              priority={i < 4}
              product={{
                id: p.id,
                slug: p.slug,
                title: p.title,
                images: p.images,
                priceUsd: p.priceUsd,
                referencePriceUsd: p.referencePriceUsd,
                originCountry: p.supplier.country,
                deliveryDaysMin: p.deliveryDaysMin,
                deliveryDaysMax: p.deliveryDaysMax,
                createdAt: p.createdAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
