import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import type { User } from "@prisma/client";
import { logout } from "@/actions/auth";
import { SearchBox } from "@/components/search-box";
import { CategoryNav } from "@/components/category-nav";

export function Header({ user, cartCount }: { user: User | null; cartCount: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-primary">
          Ecomex<span className="text-foreground"> Market</span>
        </Link>

        <SearchBox className="hidden flex-1 sm:block" />

        <nav className="ml-auto flex items-center gap-1">
          {user ? (
            <div className="group relative">
              <button className="flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-foreground hover:bg-foreground/5">
                <UserRound className="size-4" />
                <span className="hidden max-w-28 truncate md:inline">{user.name.split(" ")[0]}</span>
              </button>
              <div className="invisible absolute right-0 top-full z-50 w-48 rounded-xl border border-border bg-surface p-1 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                <Link href="/mis-pedidos" className="block rounded-lg px-3 py-2 text-sm hover:bg-background">
                  Mis pedidos
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
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-foreground hover:bg-foreground/5"
            >
              <UserRound className="size-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}

          <Link
            href="/carrito"
            className="relative flex h-10 items-center gap-2 rounded-full px-3 text-sm text-foreground hover:bg-foreground/5"
            aria-label={`Carrito (${cartCount})`}
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Búsqueda mobile */}
      <div className="px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>

      <CategoryNav />
    </header>
  );
}
