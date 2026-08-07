import Link from "next/link";
import { Isologo } from "@/components/isologo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl font-extrabold lowercase text-foreground">
            <Isologo className="size-8" />
            <span>
              traelo<span className="text-accent">.</span>
            </span>
          </p>
          <p className="mt-3 text-sm text-muted">
            Comprá directo de fábrica, con precio final sin sorpresas. Tu compra viaja
            en barco y entra al país a tu nombre. Lo viste en la fábrica, traelo.
          </p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3 text-muted">Cómo funciona</p>
          <ol className="space-y-1 text-muted">
            <li>1. Elegís y pagás el precio final en dólares.</li>
            <li>2. Compramos tu pedido al proveedor y lo embarcamos.</li>
            <li>3. Te llega a tu casa en 45–60 días. Nada más que pagar.</li>
          </ol>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3 text-muted">Ayuda</p>
          <ul className="space-y-1">
            <li>
              <Link href="/mis-pedidos" className="text-muted hover:text-primary">
                Seguí tu pedido
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="text-muted hover:text-primary">
                Catálogo completo
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Régimen courier: hasta 50 kg y US$ 3.000 por pedido. El comprador es el
            importador.
          </p>
        </div>
      </div>
    </footer>
  );
}
