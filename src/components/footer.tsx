import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-xl font-black lowercase tracking-tight text-foreground">
            traelo<span className="text-accent">.</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Comprá directo a proveedores del exterior, con precio final sin sorpresas.
            Tu compra viaja en barco y entra al país a tu nombre. Lo viste afuera, traelo.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-foreground">Cómo funciona</p>
          <ol className="space-y-1 text-muted">
            <li>1. Elegís y pagás el precio final en dólares.</li>
            <li>2. Compramos tu pedido al proveedor y lo embarcamos.</li>
            <li>3. Te llega a tu casa en 45–60 días. Nada más que pagar.</li>
          </ol>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-foreground">Ayuda</p>
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
