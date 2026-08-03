"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Search, X } from "lucide-react";
import { formatUsd } from "@/lib/format";

// Búsqueda con autocomplete estilo marketplace: sugerencias de productos al
// tipear (con foto y precio final), búsquedas recientes al enfocar vacío,
// navegación con ↑ ↓ Enter Esc. Enter va al catálogo con la búsqueda completa.

type Suggestion = { slug: string; title: string; image: string; priceUsd: number; category: string };

const RECENT_KEY = "sp_busquedas";
const MAX_RECENT = 5;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((s) => s !== q)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage lleno o bloqueado: no es crítico
  }
}

function SearchBoxInner({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = pathname === "/catalogo" ? (params.get("q") ?? "") : "";

  const [value, setValue] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const [loading, setLoading] = useState(false);

  const rootRef = useRef<HTMLFormElement>(null);
  const typingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sincroniza con la URL (back/forward, chips), salvo mientras tipeás
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    if (!typingRef.current) setValue(urlQ);
  }

  // Cerrar al clickear afuera
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const fetchSuggestions = (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    fetch(`/api/buscar?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { products: Suggestion[]; total: number }) => {
        setSuggestions(data.products);
        setTotal(data.total);
        setHighlight(-1);
        setLoading(false);
      })
      .catch(() => {});
  };

  const onChange = (q: string) => {
    setValue(q);
    typingRef.current = true;
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(q.trim()), 250);
    } else {
      setSuggestions([]);
      setTotal(0);
    }
  };

  const goCatalog = (q: string) => {
    const clean = q.trim();
    if (clean) saveRecent(clean);
    setOpen(false);
    typingRef.current = false;
    setValue(clean);
    router.push(clean ? `/catalogo?q=${encodeURIComponent(clean)}` : "/catalogo", { scroll: false });
  };

  const goProduct = (s: Suggestion) => {
    saveRecent(value.trim() || s.title);
    setOpen(false);
    typingRef.current = false;
    router.push(`/p/${s.slug}`);
  };

  const showRecent = value.trim().length < 2 && recent.length > 0;
  const hasQuery = value.trim().length >= 2;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const count = showRecent ? recent.length : suggestions.length;
    if (e.key === "ArrowDown" || e.key === "Down") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % Math.max(count, 1));
    } else if (e.key === "ArrowUp" || e.key === "Up") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? count - 1 : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && showRecent) goCatalog(recent[highlight]);
      else if (highlight >= 0 && suggestions[highlight]) goProduct(suggestions[highlight]);
      else goCatalog(value);
    } else if (e.key === "Escape" || e.key === "Esc") {
      setOpen(false);
    }
  };

  return (
    <form
      ref={rootRef}
      onSubmit={(e) => {
        e.preventDefault();
        goCatalog(value);
      }}
      className={`relative ${className ?? ""}`}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setRecent(readRecent());
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        aria-expanded={open}
        autoComplete="off"
        className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            setSuggestions([]);
            setTotal(0);
            if (pathname === "/catalogo") goCatalog("");
          }}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}

      {open && (showRecent || hasQuery) && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {showRecent && (
            <ul>
              <li className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted">
                Búsquedas recientes
              </li>
              {recent.map((r, i) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => goCatalog(r)}
                    className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm hover:bg-background ${highlight === i ? "bg-background" : ""}`}
                  >
                    <Clock className="size-4 text-muted" /> {r}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasQuery && (
            <>
              {suggestions.length > 0 ? (
                <ul>
                  {suggestions.map((s, i) => (
                    <li key={s.slug}>
                      <button
                        type="button"
                        onClick={() => goProduct(s)}
                        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-background ${highlight === i ? "bg-background" : ""}`}
                      >
                        <span className="relative block size-10 shrink-0 overflow-hidden rounded-lg bg-white">
                          <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm">{s.title}</span>
                          <span className="text-xs text-muted">{s.category}</span>
                        </span>
                        <span data-price className="text-sm font-semibold tabular-nums text-accent">
                          {formatUsd(s.priceUsd)}
                        </span>
                      </button>
                    </li>
                  ))}
                  <li className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => goCatalog(value)}
                      className="w-full cursor-pointer px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-background"
                    >
                      Ver los {total} resultados para “{value.trim()}”
                    </button>
                  </li>
                </ul>
              ) : (
                !loading && (
                  <p className="px-4 py-4 text-sm text-muted">
                    Nada para “{value.trim()}”. Probá con otra palabra.
                  </p>
                )
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}

export function SearchBox({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <SearchBoxInner className={className} />
    </Suspense>
  );
}
