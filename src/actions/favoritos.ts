"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ToggleFavResult = { ok: true; fav: boolean } | { ok: false; needLogin: true };

export async function toggleFavorite(productId: string): Promise<ToggleFavResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needLogin: true };

  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) {
    await db.favorite.delete({ where: key });
  } else {
    await db.favorite.create({ data: { userId: user.id, productId } });
  }
  revalidatePath("/favoritos");
  return { ok: true, fav: !existing };
}
