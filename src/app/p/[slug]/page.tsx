import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Ship, ShieldCheck, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { CATEGORY_KEY, CATEGORY_LABEL } from "@/lib/categorias";
import { formatKg, formatUsd } from "@/lib/format";
import { Gallery } from "@/components/gallery";
import { BuyBox } from "@/components/buy-box";
import { FavButton } from "@/components/fav-button";
import { Price } from "@/components/price";
import { ProductCard, savingsPct } from "@/components/product-card";
import { TrackView } from "@/components/track-view";

// Talles con orden natural (S < M < L…), el resto alfanumérico
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
function variantSort(a: { value: string }, b: { value: string }): number {
  const ia = SIZE_ORDER.indexOf(a.value.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.value.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== ib) return ia === -1 ? 1 : -1;
  return a.value.localeCompare(b.value, "es", { numeric: true });
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { supplier: { select: { country: true } }, variants: true },
  });
  product?.variants.sort(variantSort);
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: { images: [product.images[0]] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.active) notFound();

  const [related, favIds] = await Promise.all([
    db.product.findMany({
      where: { active: true, category: product.category, id: { not: product.id } },
      include: { supplier: { select: { country: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    getFavoriteIds(),
  ]);
  const pct = savingsPct(product.priceUsd, product.referencePriceUsd);

  return (
    <div className="py-6 pb-24 md:pb-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link href="/catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        <ChevronRight className="size-4" />
        <Link href={`/catalogo?categoria=${CATEGORY_KEY[product.category]}`} className="hover:text-primary">
          {CATEGORY_LABEL[product.category]}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={product.images} alt={product.title} />

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold leading-snug">{product.title}</h1>
              <FavButton
                productId={product.id}
                initialFav={favIds.has(product.id)}
                className="shrink-0 border border-border"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Price value={product.priceUsd} className="text-3xl" />
              {pct !== null && (
                <>
                  <span className="text-base text-muted line-through">
                    {formatUsd(product.referencePriceUsd!)}
                  </span>
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-sm font-bold text-accent">
                    Ahorrás {pct}%
                  </span>
                </>
              )}
            </div>
            {pct !== null && (
              <p className="mt-0.5 text-xs text-muted">
                Contra {formatUsd(product.referencePriceUsd!)} de precio local de referencia.
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              Precio final en tu casa. Producto, envío internacional e impuestos incluidos —
              nada más que pagar.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="flex items-center gap-2">
              <Ship className="size-4 shrink-0 text-primary" />
              Llega en {product.deliveryDaysMin}–{product.deliveryDaysMax} días desde{" "}
              {product.supplier.country} — viaja en barco, por eso el precio.
            </p>
            <p className="flex items-center gap-2">
              <Scale className="size-4 shrink-0 text-primary" />
              Peso estimado: {formatKg(product.weightKg)}
            </p>
            <p className="flex items-center gap-2 text-success">
              <ShieldCheck className="size-4 shrink-0" />
              Seguimiento incluido en cada paso
            </p>
          </div>

          <BuyBox
            productId={product.id}
            priceUsd={product.priceUsd.toNumber()}
            variants={product.variants.map((v) => ({
              id: v.id,
              kind: v.kind,
              value: v.value,
              available: v.available,
            }))}
          />

          <div>
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-semibold">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
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
                  deliveryDaysMin: p.deliveryDaysMin,
                  deliveryDaysMax: p.deliveryDaysMax,
                  createdAt: p.createdAt,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <TrackView slug={product.slug} />
    </div>
  );
}
