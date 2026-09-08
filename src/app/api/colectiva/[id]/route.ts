import { NextResponse } from "next/server";
import { getGroupBuyState } from "@/lib/colectiva-db";

// Estado en vivo del contenedor (compra colectiva). El cliente lo consulta cada
// pocos segundos para ver bajar el precio cuando se suma gente.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getGroupBuyState(id);
  if (!state) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
