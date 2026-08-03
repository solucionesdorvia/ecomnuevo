import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Este producto ya no está disponible</h1>
      <p className="text-muted">Puede que se haya agotado en origen o que lo hayamos retirado del catálogo.</p>
      <Link
        href="/catalogo"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Ver el catálogo
      </Link>
    </div>
  );
}
