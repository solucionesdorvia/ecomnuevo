"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "electronica", label: "Electrónica" },
  { key: "hogar", label: "Hogar" },
  { key: "indumentaria", label: "Indumentaria" },
  { key: "herramientas", label: "Herramientas" },
];

function CategoryNavInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname === "/catalogo" ? params.get("categoria") : null;

  const enFabricas = pathname.startsWith("/fabricas");

  return (
    <nav aria-label="Categorías" className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2">
      {CATEGORIES.map((c) => {
        const isActive = active === c.key;
        return (
          <Link
            key={c.key}
            href={`/catalogo?categoria=${c.key}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors",
              isActive
                ? "bg-primary font-medium text-white"
                : "text-muted hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {c.label}
          </Link>
        );
      })}
      <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      <Link
        href="/fabricas"
        aria-current={enFabricas ? "page" : undefined}
        className={cn(
          "whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors",
          enFabricas
            ? "bg-primary font-medium text-white"
            : "text-muted hover:bg-foreground/5 hover:text-foreground",
        )}
      >
        Fábricas
      </Link>
    </nav>
  );
}

export function CategoryNav() {
  return (
    <Suspense fallback={<div className="pb-2" />}>
      <CategoryNavInner />
    </Suspense>
  );
}
