import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/categorias";

// Sugerencias del autocomplete de búsqueda. Devuelve hasta 6 productos.
// Cada palabra de la consulta tiene que matchear (título o descripción).
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ products: [], total: 0 });

  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const where = {
    active: true,
    AND: words.map((w) => ({
      OR: [
        { title: { contains: w, mode: "insensitive" as const } },
        { description: { contains: w, mode: "insensitive" as const } },
      ],
    })),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: { slug: true, title: true, images: true, priceUsd: true, category: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    total,
    products: products.map((p) => ({
      slug: p.slug,
      title: p.title,
      image: p.images[0],
      priceUsd: p.priceUsd.toNumber(),
      category: CATEGORY_LABEL[p.category],
    })),
  });
}
