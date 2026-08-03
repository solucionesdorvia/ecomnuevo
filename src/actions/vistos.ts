"use server";

import { cookies } from "next/headers";

const COOKIE = "sp_vistos";
const MAX = 8;

/** Registra un producto visto (más reciente primero, sin duplicados). */
export async function registerProductView(slug: string): Promise<void> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return;
  const cookieStore = await cookies();
  let slugs: string[] = [];
  try {
    const raw = cookieStore.get(COOKIE)?.value;
    if (raw) slugs = JSON.parse(raw).filter((s: unknown) => typeof s === "string");
  } catch {
    // cookie rota: se regenera
  }
  slugs = [slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX);
  cookieStore.set(COOKIE, JSON.stringify(slugs), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
