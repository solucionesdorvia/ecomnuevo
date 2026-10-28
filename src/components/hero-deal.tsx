import Image from "next/image";
import Link from "next/link";
import { formatUsd } from "@/lib/format";
import { savingsPct } from "@/components/product-card";
import { BrandIcon } from "@/components/brand-icon";

/**
 * Hero de deseo: un producto REAL del catálogo como protagonista, con el precio
 * final anclado en naranja y el ahorro contra comprarlo acá. Lidera con ganas de
 * comprar (no con logística); la confianza del viaje vive más abajo en la página.
 * La foto va sobre blanco para que explote en contraste sobre el navy del hero.
 */
export type HeroProductData = {
  slug: string;
  title: string;
  images: string[];
  priceUsd: number | { toNumber(): number };
  referencePriceUsd?: number | { toNumber(): number } | null;
  supplierName?: string | null;
  deliveryDaysMax: number;
};

export function HeroDeal({ product }: { product: HeroProductData }) {
  const pct = savingsPct(product.priceUsd, product.referencePriceUsd);
  const ref = product.referencePriceUsd ?? null;

  return (
    <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px]">
      {/* escena: resplandor celeste muy tenue, da aire sobre el navy. inset-0 para
          no desbordar el ancho en mobile (nada de scroll horizontal). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 60% at 62% 34%, rgba(143,205,235,.22), transparent 72%)",
        }}
      />

      <Link href={`/p/${product.slug}`} className="group block">
        {/* frame del producto: foto real sobre blanco */}
        <div className="hero-rise relative aspect-[5/4] overflow-hidden rounded-[20px] bg-surface shadow-[0_28px_64px_-24px_rgba(0,0,0,.6)] ring-1 ring-white/10">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 86vw, 460px"
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          {pct !== null && (
            <span className="absolute left-4 top-4 rounded-lg bg-accent px-3 py-1.5 font-mono-ui text-[13px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(255,90,31,.7)]">
              −{pct}% vs. acá
            </span>
          )}
          <span className="absolute right-4 top-4 rounded-lg bg-primary/70 px-3 py-1.5 font-mono-ui text-[11px] font-semibold tracking-wide text-celeste-soft backdrop-blur-sm">
            DIRECTO DE FÁBRICA
          </span>
        </div>

        {/* etiqueta de precio final, sobresaliendo del frame */}
        <div
          className="hero-rise relative z-10 mx-4 -mt-7 flex flex-col gap-2.5 rounded-2xl border border-celeste/25 bg-primary-2 p-4 shadow-[0_20px_48px_-18px_rgba(0,0,0,.72)]"
          style={{ animationDelay: ".16s" }}
        >
          <p className="truncate text-sm font-semibold text-white">{product.title}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <div
                data-price
                className="font-display text-[38px] font-extrabold leading-none tracking-[-0.03em] text-accent sm:text-[40px]"
              >
                {formatUsd(product.priceUsd)}
              </div>
              <div className="mt-1.5 font-mono-ui text-[11px] tracking-wide text-celeste-soft">
                PRECIO FINAL · EN TU PUERTA
              </div>
            </div>
            <div className="text-left sm:shrink-0 sm:text-right">
              {ref !== null && (
                <div className="text-sm text-celeste-soft/55 line-through">
                  {formatUsd(ref)} acá
                </div>
              )}
              <div className="mt-1 flex items-center gap-1.5 font-mono-ui text-[11px] text-celeste sm:justify-end">
                <BrandIcon name="barco" className="size-4 shrink-0" /> ~{product.deliveryDaysMax} DÍAS
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
