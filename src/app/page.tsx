import Link from "next/link";
import { PackageCheck, Ship, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { getRecentlyViewedSlugs } from "@/lib/vistos";
import { ProductCard } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icon";

const CATEGORIES = [
  { key: "electronica", label: "Electrónica" },
  { key: "hogar", label: "Hogar" },
  { key: "indumentaria", label: "Indumentaria" },
  { key: "herramientas", label: "Herramientas" },
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
      {/* Hero — card de tinta oceánica, titular display, ruta punteada de fondo */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-white sm:px-10 sm:py-14">
        {/* trazo de ruta decorativo, muy sutil */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 200"
          className="pointer-events-none absolute -right-10 top-0 h-full w-2/3 opacity-[0.12]"
          fill="none"
        >
          <path
            d="M20 170 C 120 60, 220 150, 380 30"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="0.1 14"
          />
        </svg>

        <div className="relative flex flex-col items-start gap-5">
          <p className="eyebrow text-celeste">Marketplace de importación</p>
          <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Lo viste en la fábrica.
            <br />
            <span className="text-accent">Traelo.</span>
          </h1>
          <p className="max-w-xl text-lg text-celeste-soft">
            Comprás directo de fábrica en China. Precio final, un solo pago, y te llega
            a la puerta — a tu nombre. Nada más que pagar.
          </p>
          <Link
            href="/catalogo"
            className="rounded-full bg-accent px-7 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Ver catálogo
          </Link>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { Icon: ShieldCheck, t: "Precio final en tu casa" },
              { Icon: PackageCheck, t: "Directo de fábrica" },
              { Icon: Ship, t: "Seguimiento en cada paso" },
            ].map(({ Icon, t }) => (
              <p key={t} className="flex items-center gap-2 font-mono-ui text-xs text-celeste">
                <Icon className="size-4 shrink-0" />
                {t}
              </p>
            ))}
          </div>
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
          {featured.map((p, i) => (
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
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:-translate-y-0.5 hover:border-celeste hover:shadow-md"
            >
              <span
                className="flex size-16 items-center justify-center rounded-2xl transition-colors group-hover:brightness-95"
                style={{ background: "color-mix(in srgb, var(--celeste) 22%, white)" }}
              >
                <CategoryIcon k={c.key} className="size-9 text-foreground" />
              </span>
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
