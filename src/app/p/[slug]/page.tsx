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
import { ProductCard, savingsPct, skuFor } from "@/components/product-card";
import { ProductJsonLd } from "@/components/product-jsonld";
import { TrustStrip } from "@/components/trust-strip";
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
    include: { supplier: { select: { id: true, name: true, country: true } }, variants: true },
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
    alternates: { canonical: `/p/${slug}` },
    openGraph: { images: [product.images[0]], type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.active) notFound();

  const [related, favIds] = await Promise.all([
    db.product.findMany({
      where: { active: true, category: product.category, id: { not: product.id } },
      include: { supplier: { select: { id: true, name: true, country: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    getFavoriteIds(),
  ]);
  const pct = savingsPct(product.priceUsd, product.referencePriceUsd);

  return (
    <div className="py-6 pb-24 md:pb-6">
      <ProductJsonLd
        slug={product.slug}
        title={product.title}
        description={product.description}
        images={product.images}
        priceUsd={product.priceUsd.toNumber()}
        active={product.active}
        category={CATEGORY_LABEL[product.category]}
      />
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
              <div>
                <p className="eyebrow text-muted">
                  SKU {skuFor(product.id)} ·{" "}
                  <Link href={`/fabricas/${product.supplier.id}`} className="text-accent hover:underline">
                    {product.supplier.name}
                  </Link>
                </p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.03em]">
                  {product.title}
                </h1>
              </div>
              <FavButton
                productId={product.id}
                initialFav={favIds.has(product.id)}
                className="shrink-0 border border-border"
              />
            </div>
          </div>

          {/* Precio final + desglose (datos reales de costeo) */}
          <div className="rounded-[10px] bg-primary p-5 text-white sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-celeste">Precio final en tu casa</p>
                <p
                  data-price
                  className="mt-1.5 font-display text-4xl font-extrabold tracking-[-0.03em] tabular-nums"
                >
                  {formatUsd(product.priceUsd)}
                </p>
                {pct !== null && (
                  <p className="mt-1 font-mono-ui text-[11px] text-celeste-soft">
                    Ahorrás {pct}% vs. {formatUsd(product.referencePriceUsd!)} local
                  </p>
                )}
              </div>
              {pct !== null && (
                <span className="rounded-md bg-accent px-2.5 py-1 font-mono-ui text-xs font-bold">
                  -{pct}%
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-celeste/35 pt-3.5 font-mono-ui text-[13px]">
              {[
                { l: "Producto (fábrica)", v: product.costUsd },
                { l: "Flete marítimo", v: product.freightUsd },
                { l: "Impuestos y aduana", v: product.taxesUsd },
                { l: "Servicio traelo.", v: product.marginUsd },
              ].map((row) => (
                <div key={row.l} className="flex justify-between">
                  <span className="text-celeste-soft">{row.l}</span>
                  <span className="tabular-nums">{formatUsd(row.v)}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-celeste/35 pt-2.5 font-bold">
                <span>Total</span>
                <span className="tabular-nums text-accent">{formatUsd(product.priceUsd)}</span>
              </div>
            </div>
          </div>

          {/* Info de envío */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-border bg-surface p-3.5">
              <p className="eyebrow text-muted">Llega en</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-display text-lg font-extrabold text-primary">
                <Ship className="size-4 text-accent" /> {product.deliveryDaysMin}–{product.deliveryDaysMax} días
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-surface p-3.5">
              <p className="eyebrow text-muted">Peso del bulto</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-mono-ui text-lg font-bold text-primary">
                <Scale className="size-4 text-accent" /> {formatKg(product.weightKg)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-[10px] bg-celeste-soft/60 p-3.5 text-[13px] leading-relaxed text-primary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>Viene por barco.</strong> Son ~{product.deliveryDaysMax} días de viaje y seguís
              cada movimiento desde tu cuenta. Si tenés apuro, esto no es para vos.
            </span>
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

          <TrustStrip />

          <div>
            <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-0.02em]">Descripción</h2>
            <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-extrabold tracking-[-0.03em]">
            También te puede interesar
          </h2>
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
                  supplierName: p.supplier.name,
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
