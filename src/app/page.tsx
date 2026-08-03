import Link from "next/link";
import { PackageCheck, Ship, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { getRecentlyViewedSlugs } from "@/lib/vistos";
import { ProductCard } from "@/components/product-card";

const CATEGORIES = [
  { key: "electronica", label: "Electrónica", emoji: "🎧" },
  { key: "hogar", label: "Hogar", emoji: "🏠" },
  { key: "indumentaria", label: "Indumentaria", emoji: "🧥" },
  { key: "herramientas", label: "Herramientas", emoji: "🔧" },
];

export default async function Home() {
  const [featured, favIds, recentSlugs] = await Promise.all([
    db.product.findMany({
      where: { active: true, featured: true },
      include: { supplier: { select: { country: true } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    getFavoriteIds(),
    getRecentlyViewedSlugs(),
  ]);

  // "Seguí mirando": vistos recientemente, en el orden de la cookie
  const recentProducts =
    recentSlugs.length > 0
      ? await db.product.findMany({
          where: { active: true, slug: { in: recentSlugs } },
          include: { supplier: { select: { country: true } } },
        })
      : [];
  recentProducts.sort((a, b) => recentSlugs.indexOf(a.slug) - recentSlugs.indexOf(b.slug));

  return (
    <div className="flex flex-col gap-12 py-8">
      {/* Hero */}
      <section className="flex flex-col items-start gap-4 py-6 sm:py-10">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Comprá afuera, <span className="text-primary">recibí en tu casa.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Productos directo de proveedores del exterior, en dólares. El precio que ves es
          final: producto, envío e impuestos incluidos. Nada más que pagar.
        </p>
        <Link
          href="/catalogo"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          Ver catálogo
        </Link>
        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            Precio final puesto en tu casa
          </p>
          <p className="flex items-center gap-2">
            <PackageCheck className="size-5 shrink-0 text-success" />
            Comprás directo al proveedor
          </p>
          <p className="flex items-center gap-2">
            <Ship className="size-5 shrink-0 text-success" />
            Seguimiento en cada paso
          </p>
        </div>
      </section>

      {/* Destacados */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Destacados</h2>
          <Link href="/catalogo" className="text-sm text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {featured.map((p) => (
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

      {/* Seguí mirando */}
      {recentProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Seguí mirando</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {recentProducts.slice(0, 4).map((p) => (
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

      {/* Categorías */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Explorá por categoría</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/catalogo?categoria=${c.key}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-semibold">¿Cómo funciona?</h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            {
              n: 1,
              t: "Elegís y pagás el precio final",
              d: "En dólares, con tarjeta. El precio ya incluye producto, envío marítimo e impuestos.",
            },
            {
              n: 2,
              t: "Compramos y embarcamos tu pedido",
              d: "Nuestro equipo lo compra al proveedor y lo despacha por barco, consolidado.",
            },
            {
              n: 3,
              t: "Te llega a tu casa",
              d: "En 45–60 días, a tu nombre. Seguís cada paso desde tu cuenta. Nada más que pagar.",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="font-medium">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
