import "server-only";
import { cookies } from "next/headers";

/** Slugs de productos vistos recientemente (más reciente primero). */
export async function getRecentlyViewedSlugs(): Promise<string[]> {
  const cookieStore = await cookies();
  try {
    const raw = cookieStore.get("sp_vistos")?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}
