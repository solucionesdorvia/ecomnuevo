import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Ids de productos favoritos del usuario actual (vacío si no hay sesión). */
export async function getFavoriteIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const favs = await db.favorite.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  return new Set(favs.map((f) => f.productId));
}
