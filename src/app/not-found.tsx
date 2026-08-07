import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <Compass className="size-12 text-muted/50" />
      <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Esta página no existe</h1>
      <p className="max-w-md text-muted">
        Puede que el link esté vencido o mal escrito. Lo importante sigue estando: el
        catálogo completo, con precio final y nada más que pagar.
      </p>
      <Link
        href="/catalogo"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Ir al catálogo
      </Link>
    </div>
  );
}
