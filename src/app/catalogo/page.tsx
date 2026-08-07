import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { CATEGORY_BY_KEY, CATEGORY_LABEL } from "@/lib/categorias";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Catálogo" };

const PAGE_SIZE = 24;

type Params = {
  q?: string;
  categoria?: string;
  origen?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
  pagina?: string;
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const category = params.categoria ? CATEGORY_BY_KEY[params.categoria] : undefined;
  const origen = params.origen?.trim();
  const min = Number(params.precio_min) || undefined;
  const max = Number(params.precio_max) || undefined;
  const orden = params.orden ?? "novedad";
  const page = Math.max(1, Number(params.pagina) || 1);

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(origen ? { supplier: { country: origen } } : {}),
    ...(min || max ? { priceUsd: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    orden === "precio_asc" ? { priceUsd: "asc" } : orden === "precio_desc" ? { priceUsd: "desc" } : { createdAt: "desc" };

  const [products, total, countries, favIds] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      include: { supplier: { select: { id: true, name: true, country: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.supplier.findMany({ select: { country: true }, distinct: ["country"], orderBy: { country: "asc" } }),
    getFavoriteIds(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = category ? CATEGORY_LABEL[category] : q ? `Resultados para “${q}”` : "Catálogo completo";

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (params.categoria) p.set("categoria", params.categoria);
    if (origen) p.set("origen", origen);
    if (params.precio_min) p.set("precio_min", params.precio_min);
    if (params.precio_max) p.set("precio_max", params.precio_max);
    if (orden !== "novedad") p.set("orden", orden);
    if (n > 1) p.set("pagina", String(n));
    const s = p.toString();
    return `/catalogo${s ? `?${s}` : ""}`;
  };

  const orderLabel =
    orden === "precio_asc" ? "MENOR PRECIO" : orden === "precio_desc" ? "MAYOR PRECIO" : "NOVEDAD";
  const catChips = [
    { key: "", label: "Todo" },
    { key: "electronica", label: "Electrónica" },
    { key: "hogar", label: "Hogar" },
    { key: "indumentaria", label: "Indumentaria" },
    { key: "herramientas", label: "Herramientas" },
  ];
  const chipHref = (key: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (key) p.set("categoria", key);
    if (origen) p.set("origen", origen);
    if (orden !== "novedad") p.set("orden", orden);
    const s = p.toString();
    return `/catalogo${s ? `?${s}` : ""}`;
  };
  const currentCatKey = params.categoria ?? "";

  return (
    <div className="py-7">
      <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <p className="eyebrow mt-2 text-muted">
        {total} {total === 1 ? "producto" : "productos"} · ordenado por {orderLabel}
      </p>

      {/* Chips de categoría */}
      <div className="mt-5 flex flex-wrap gap-2">
        {catChips.map((c) => {
          const active = currentCatKey === c.key;
          return (
            <Link
              key={c.key || "todo"}
              href={chipHref(c.key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "chip border",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-primary/18 bg-surface text-primary hover:border-primary/40",
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-5">
        <FilterBar countries={countries.map((c) => c.country)} />
      </div>

      {products.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nada con ese nombre."
            subtitle="Probá con otra palabra o menos filtros, o escribinos y lo buscamos en fábrica."
            cta={{ label: "Ver todo el catálogo →", href: "/catalogo" }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              isFav={favIds.has(p.id)}
              product={{
                id: p.id,
                slug: p.slug,
                title: p.title,
                images: p.images,
                priceUsd: p.priceUsd,
                referencePriceUsd: p.referencePriceUsd,
                originCountry: p.supplier.country,
                supplierName: p.supplier.name,
                deliveryDaysMin: p.deliveryDaysMin,
                deliveryDaysMax: p.deliveryDaysMax,
                createdAt: p.createdAt,
              }}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-2">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-background",
              page === 1 && "pointer-events-none opacity-40",
            )}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm",
                n === page ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-background",
              )}
            >
              {n}
            </Link>
          ))}
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-background",
              page === totalPages && "pointer-events-none opacity-40",
            )}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </Link>
        </nav>
      )}
    </div>
  );
}
