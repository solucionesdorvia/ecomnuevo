import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getGroupBuyFull } from "@/lib/colectiva-db";
import { GroupBuyLive } from "@/components/group-buy-live";

export const metadata: Metadata = { title: "Compra colectiva" };

export default async function ColectivaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gb = await getGroupBuyFull(id);
  if (!gb) notFound();

  return (
    <div className="py-6">
      <Link href="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronLeft className="size-4" /> Volver al catálogo
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
        {/* Producto */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-white">
            {gb.product.images[0] && (
              <Image
                src={gb.product.images[0]}
                alt={gb.product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-cover"
                priority
              />
            )}
            <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 font-mono-ui text-[11px] uppercase tracking-wide text-celeste">
              Compra colectiva
            </span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.03em] text-primary sm:text-3xl">
            {gb.product.title}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Un contenedor abierto: cuanta más gente se suma, más baja el precio para todos. Viaja por
            barco, precio final sin sorpresas en la aduana.
          </p>
        </div>

        {/* Panel en vivo */}
        <GroupBuyLive initial={gb.state} tiers={gb.tiers} recent={gb.recent} />
      </div>
    </div>
  );
}
