import Link from "next/link";
import { UserRound } from "lucide-react";
import type { User } from "@prisma/client";
import { logout } from "@/actions/auth";
import { SearchBox } from "@/components/search-box";
import { Isologo } from "@/components/isologo";

const NAV = [
  { label: "Catálogo", href: "/catalogo" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Para tu negocio", href: "/fabricas" },
  { label: "Seguí tu carga", href: "/mis-pedidos" },
];

// Header "traelo. v1": barra de tinta oceánica. Desktop: wordmark + nav + buscador
// + carrito + ingresar. Mobile: wordmark + carrito, con el buscador debajo.
export function Header({ user, cartCount }: { user: User | null; cartCount: number }) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-white">
      <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-4 py-3.5 lg:px-14 lg:py-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Traelo — inicio">
          <Isologo className="size-8 lg:size-9" />
          <span className="font-display text-2xl font-extrabold tracking-[-0.03em] lg:text-[26px]">
            traelo<span className="text-accent">.</span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-7 text-sm text-white/80 lg:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="transition-colors hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:gap-5">
          <SearchBox dark className="hidden w-64 lg:block" />

          <Link
            href="/carrito"
            className="font-mono-ui text-xs text-celeste transition-colors hover:text-white"
            aria-label={`Carrito (${cartCount})`}
          >
            CARRITO ({cartCount})
          </Link>

          {user ? (
            <div className="group relative">
              <button className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-white/90 hover:bg-white/10">
                <UserRound className="size-4" />
                <span className="hidden max-w-24 truncate lg:inline">{user.name.split(" ")[0]}</span>
              </button>
              <div className="invisible absolute right-0 top-full z-50 w-48 rounded-xl border border-border bg-surface p-1 text-foreground opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                <Link href="/mis-pedidos" className="block rounded-lg px-3 py-2 text-sm hover:bg-background">
                  Seguí tu carga
                </Link>
                <Link href="/favoritos" className="block rounded-lg px-3 py-2 text-sm hover:bg-background">
                  Favoritos
                </Link>
                {(user.role === "OPERADOR" || user.role === "ADMIN") && (
                  <Link href="/operador" className="block rounded-lg px-3 py-2 text-sm hover:bg-background">
                    Panel de operador
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-background">
                    Administración
                  </Link>
                )}
                <form action={logout}>
                  <button className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-background">
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link
              href="/ingresar"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Buscador mobile */}
      <div className="px-4 pb-3 lg:hidden">
        <SearchBox dark />
      </div>
    </header>
  );
}
