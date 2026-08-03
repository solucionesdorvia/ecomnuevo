import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/price";
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
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  createdAt?: Date;
};

const NEW_DAYS = 30;

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

export function ProductCard({
  product,
  isFav = false,
}: {
  product: ProductCardData;
  isFav?: boolean;
}) {
  const pct = savingsPct(product.priceUsd, product.referencePriceUsd);
  const isNew =
    product.createdAt != null &&
    Date.now() - product.createdAt.getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Nuevo
          </span>
        )}
        <FavButton productId={product.id} initialFav={isFav} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm text-foreground">{product.title}</h3>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Price value={product.priceUsd} className="text-lg" />
          {pct !== null && (
            <>
              <span className="text-xs text-muted line-through">
                {formatUsd(product.referencePriceUsd!)}
              </span>
              <span className="rounded bg-accent/10 px-1 py-0.5 text-[11px] font-bold text-accent">
                -{pct}%
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-muted">
          Precio final en tu casa · desde {product.originCountry}
        </p>
        <p className="text-xs text-muted">
          Llega en {product.deliveryDaysMin}–{product.deliveryDaysMax} días
        </p>
      </div>
    </Link>
  );
}
