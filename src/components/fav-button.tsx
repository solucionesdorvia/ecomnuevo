"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/actions/favoritos";
import { cn } from "@/lib/utils";

/** Corazón de favorito, optimista. Si no hay sesión, lleva a ingresar y vuelve. */
export function FavButton({
  productId,
  initialFav,
  className,
}: {
  productId: string;
  initialFav: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [fav, setFav] = useState(initialFav);
  const [, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); // dentro de <Link> de la card: no navegar
    e.stopPropagation();
    setFav((f) => !f); // optimista
    startTransition(async () => {
      const res = await toggleFavorite(productId);
      if (!res.ok) {
        setFav(false);
        router.push(`/ingresar?volver=${encodeURIComponent(pathname)}`);
      } else {
        setFav(res.fav);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={fav}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-5 transition-colors",
          fav ? "fill-accent text-accent" : "text-muted hover:text-accent",
        )}
      />
    </button>
  );
}
