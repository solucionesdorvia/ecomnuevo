"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

// Filtros del panel de operador: buscador (cliente / nº de pedido) con debounce,
// fecha y proveedor. Todos vía URL (server component los lee y consulta). El
// filtro por estado son los chips server-rendered; acá se preservan.

export function OperadorFilters({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const urlQ = params.get("q") ?? "";
  const periodo = params.get("periodo") ?? "";
  const proveedor = params.get("proveedor") ?? "";

  // El buscador se edita local y navega con debounce; se re-sincroniza con la URL.
  const [q, setQ] = useState(urlQ);
  const [synced, setSynced] = useState(urlQ);
  if (synced !== urlQ) {
    setSynced(urlQ);
    setQ(urlQ);
  }

  const navigate = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  const setParam = (key: string, value: string) =>
    navigate((p) => (value ? p.set(key, value) : p.delete(key)));

  const onSearch = (value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", value.trim()), 350);
  };

  const hasFilters = !!(urlQ || periodo || proveedor);
  const clearAll = () => {
    setQ("");
    const estado = params.get("estado");
    start(() => router.push(estado ? `${pathname}?estado=${estado}` : pathname, { scroll: false }));
  };

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por cliente o #pedido"
          aria-label="Buscar pedidos"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <select
        value={periodo}
        onChange={(e) => setParam("periodo", e.target.value)}
        aria-label="Filtrar por fecha"
        className={selectClass}
      >
        <option value="">Cualquier fecha</option>
        <option value="hoy">Hoy</option>
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
      </select>

      <select
        value={proveedor}
        onChange={(e) => setParam("proveedor", e.target.value)}
        aria-label="Filtrar por proveedor"
        className={selectClass}
      >
        <option value="">Todos los proveedores</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          <X className="size-3.5" /> Limpiar
        </button>
      )}
      {pending && <span className="text-xs text-muted">actualizando…</span>}
    </div>
  );
}
