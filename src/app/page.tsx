import Link from "next/link";
import { db } from "@/lib/db";
import { getFavoriteIds } from "@/lib/favoritos";
import { ProductCard } from "@/components/product-card";
import { RouteLine } from "@/components/route-line";
import { Marquee } from "@/components/marquee";

export default async function Home() {
  const [featured, total, favIds] = await Promise.all([
    db.product.findMany({
      where: { active: true, featured: true },
      include: { supplier: { select: { country: true } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where: { active: true } }),
    getFavoriteIds(),
  ]);

  // Fallback si todavía no hay destacados marcados: mostrar los más nuevos.
  const products =
    featured.length > 0
      ? featured
      : await db.product.findMany({
          where: { active: true },
          include: { supplier: { select: { country: true } } },
          take: 8,
          orderBy: { createdAt: "desc" },
        });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="fullbleed bg-primary text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-14 lg:px-14 lg:py-16">
          <div>
            <h1 className="font-display text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] sm:text-5xl lg:text-[80px] lg:leading-[0.98]">
              Lo viste en la fábrica.
              <br />
              <span className="text-accent">Traelo.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-celeste-soft lg:mt-6 lg:text-[19px]">
              Comprás directo de fábricas chinas desde el catálogo. Un solo precio final en pesos
              —producto, flete marítimo e impuestos incluidos— y te lo dejamos en la puerta.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 lg:mt-8">
              <Link
                href="/catalogo"
                className="rounded-[10px] bg-accent px-7 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Ver catálogo →
              </Link>
              <Link
                href="#como-funciona"
                className="rounded-[10px] border border-celeste/45 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/5"
              >
                Cómo funciona
              </Link>
            </div>
          </div>
          <div className="lg:pl-6">
            <RouteLine className="w-full" />
          </div>
        </div>
      </section>

      {/* ── Franja de datos ──────────────────────────────────── */}
      <Marquee className="fullbleed" />

      {/* ── Recién embarcado ─────────────────────────────────── */}
      <section className="fullbleed bg-background">
        <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-14 lg:py-14">
          <div className="mb-7 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[28px] font-extrabold tracking-[-0.03em] text-primary lg:text-4xl">
              Recién embarcado
            </h2>
            <Link href="/catalogo" className="font-mono-ui text-xs text-accent hover:underline lg:text-[13px]">
              VER LOS {total} PRODUCTOS →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
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
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────── */}
      <section id="como-funciona" className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-14 lg:py-16">
          <p className="eyebrow text-celeste">Cómo funciona</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] lg:text-[44px]">
            De la fábrica a tu puerta, sin sorpresas.
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {[
              {
                n: "01",
                t: "Elegís y pagás el precio final",
                d: "Un solo precio en pesos: producto, flete marítimo e impuestos incluidos. Nada extra al recibir.",
              },
              {
                n: "02",
                t: "Compramos y embarcamos tu carga",
                d: "La compramos en fábrica y la despachamos por barco, consolidada bajo régimen courier.",
              },
              {
                n: "03",
                t: "La seguís hasta tu puerta",
                d: "~60 días de viaje, con tracking de 6 estados. Te avisamos cada movimiento por WhatsApp.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-[10px] border border-celeste/20 bg-primary-2 p-6 lg:p-7">
                <div className="font-mono-ui text-sm text-accent">{s.n}</div>
                <h3 className="mt-3 font-display text-xl font-extrabold tracking-[-0.02em] lg:text-2xl">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-celeste-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
