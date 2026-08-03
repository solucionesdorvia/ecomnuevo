import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CATEGORY_KEY } from "@/lib/categorias";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    ...Object.values(CATEGORY_KEY).map((key) => ({
      url: `${base}/catalogo?categoria=${key}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
