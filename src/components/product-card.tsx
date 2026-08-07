import Image from "next/image";
import Link from "next/link";
import { FavButton } from "@/components/fav-button";
import { formatUsd } from "@/lib/format";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  images: string[];
  priceUsd: number | { toNumber(): number };
  referencePriceUsd?: number | { toNumber(): number } | null;
  originCountry: string;
  supplierName?: string | null;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  createdAt?: Date;
};

function toNum(v: number | { toNumber(): number }): number {
  return typeof v === "object" ? v.toNumber() : v;
}

/** % de ahorro contra el precio local de referencia (solo si es real). */
export function savingsPct(
  priceUsd: ProductCardData["priceUsd"],
  referencePriceUsd: ProductCardData["referencePriceUsd"],
): number | null {
  if (referencePriceUsd == null) return null;
  const price = toNum(priceUsd);
  const ref = toNum(referencePriceUsd);
  if (ref <= price) return null;
  return Math.round((1 - price / ref) * 100);
}

/** SKU de exhibición estable ("TRL-4471") derivado del id — el diseño los muestra. */
export function skuFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return `TRL-${(1000 + (h % 9000)).toString()}`;
}

const IMG_TINTS = ["bg-celeste-soft", "bg-celeste"];

export function ProductCard({
  product,
  isFav = false,
  priority = false,
}: {
  product: ProductCardData;
  isFav?: boolean;
  /** Carga prioritaria (LCP): usar solo en las primeras imágenes visibles. */
  priority?: boolean;
}) {
  const pct = savingsPct(product.priceUsd, product.referencePriceUsd);
  const tint = IMG_TINTS[(product.id.charCodeAt(0) || 0) % IMG_TINTS.length];

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border border-primary/10 bg-surface transition-shadow hover:shadow-[0_18px_40px_rgba(12,33,54,.14)]"
    >
      <div className={`relative aspect-[4/3] w-full overflow-hidden ${tint}`}>
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {pct !== null && (
          <span className="absolute right-3 top-3 rounded-md bg-accent px-2 py-1 font-mono-ui text-[11px] font-bold text-white">
            -{pct}% vs. local
          </span>
        )}
        <FavButton productId={product.id} initialFav={isFav} className="absolute left-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="truncate font-mono-ui text-[11px] text-primary/50">
          {product.supplierName ? `${product.supplierName} · ` : "SKU "}
          {skuFor(product.id)}
        </div>
        <h3 className="mb-2.5 mt-1.5 line-clamp-2 text-[15px] font-semibold leading-tight text-primary">
          {product.title}
        </h3>
        <div className="mt-auto">
          <div data-price className="font-display text-[26px] font-extrabold leading-none tracking-[-0.03em] text-primary">
            {formatUsd(product.priceUsd)}
          </div>
          <div className="mt-1.5 text-xs text-primary/60">Precio final, con impuestos y flete</div>
          <div className="mt-3 font-mono-ui text-[11px] text-primary/65">⚓ LLEGA EN ~{product.deliveryDaysMax} DÍAS</div>
          <div className="mt-3.5 rounded-lg bg-accent py-3 text-center text-[15px] font-bold text-white transition-transform group-hover:-translate-y-0.5">
            Traelo →
          </div>
        </div>
      </div>
    </Link>
  );
}
