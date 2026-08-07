"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Tab bar inferior (solo mobile) del diseño "traelo. v1": INICIO · CATÁLOGO ·
// CARGA · CUENTA, en Space Mono sobre tinta oceánica, activo en naranja.
const TABS = [
  { label: "INICIO", href: "/", match: (p: string) => p === "/" },
  { label: "CATÁLOGO", href: "/catalogo", match: (p: string) => p.startsWith("/catalogo") || p.startsWith("/p/") },
  { label: "CARGA", href: "/mis-pedidos", match: (p: string) => p.startsWith("/mis-pedidos") },
  { label: "CUENTA", href: "/favoritos", match: (p: string) => p.startsWith("/favoritos") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-primary px-2 pb-5 pt-3.5 lg:hidden"
    >
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-mono-ui text-[10.5px] tracking-[0.06em]",
              active ? "text-accent" : "text-white/50",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
