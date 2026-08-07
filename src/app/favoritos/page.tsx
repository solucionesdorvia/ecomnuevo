import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const user = await requireUser("/favoritos");
  const favorites = await db.favorite.findMany({
    where: { userId: user.id, product: { active: true } },
    include: { product: { include: { supplier: { select: { id: true, name: true, country: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-6">
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Tus favoritos</h1>
      <p className="mb-6 text-sm text-muted">
        {favorites.length === 0
          ? "Guardá lo que te gusta para decidir después."
          : `${favorites.length} ${favorites.length === 1 ? "producto guardado" : "productos guardados"} · el precio que ves sigue siendo final`}
      </p>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface py-20 text-center">
          <Heart className="size-12 text-muted/40" />
          <p className="font-medium">Todavía no guardaste nada.</p>
          <p className="max-w-sm text-sm text-muted">
            Tocá el corazón en cualquier producto y te espera acá, con su precio final.
          </p>
          <Link
            href="/catalogo"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {favorites.map(({ product: p }) => (
            <ProductCard
              key={p.id}
              isFav
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
    </div>
  );
}
