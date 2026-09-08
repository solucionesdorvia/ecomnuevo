"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Marca todas las novedades como leídas (al abrir la campanita). */
export async function markNotificationsSeen(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db.user.update({
    where: { id: user.id },
    data: { notificationsSeenAt: new Date() },
  });
}
