import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Búsqueda de productos SIN acentos (extensión `unaccent` de Postgres):
// "cinturon" matchea "Cinturón". Cada palabra tiene que aparecer en el título o
// la descripción (AND entre palabras). Devuelve los IDs que matchean para
// componerlos con el resto de los filtros de Prisma (categoría, precio, etc.).
export async function searchProductIds(query: string): Promise<string[]> {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return [];

  const conditions = words.map((w) => {
    const like = `%${w}%`;
    return Prisma.sql`(unaccent(lower(title)) LIKE unaccent(lower(${like})) OR unaccent(lower(description)) LIKE unaccent(lower(${like})))`;
  });

  const rows = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT id FROM "Product" WHERE active = true AND ${Prisma.join(conditions, " AND ")}`,
  );
  return rows.map((r) => r.id);
}
