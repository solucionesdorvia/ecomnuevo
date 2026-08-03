"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { CATEGORY_BY_KEY, CATEGORY_LABEL } from "@/lib/categorias";

// Filtros del catálogo que se aplican SOLOS: selects al cambiar, precio con
// debounce mientras tipeás. Nada de botón "Aplicar".

const ORDEN_LABEL: Record<string, string> = {
  novedad: "Novedad",
  precio_asc: "Menor precio",
  precio_desc: "Mayor precio",
};

export function FilterBar({ countries }: { countries: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = params.get("q") ?? "";
  const categoria = params.get("categoria") ?? "";
  const origen = params.get("origen") ?? "";
  const orden = params.get("orden") ?? "novedad";

  // Los precios se editan local y navegan con debounce
  const [min, setMin] = useState(params.get("precio_min") ?? "");
  const [max, setMax] = useState(params.get("precio_max") ?? "");
  useEffect(() => {
    setMin(params.get("precio_min") ?? "");
    setMax(params.get("precio_max") ?? "");
  }, [params]);

  const navigate = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("pagina"); // cualquier cambio de filtro vuelve a la página 1
    startTransition(() => {
      router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    });
  };

  const setParam = (key: string, value: string) =>
    navigate((p) => (value ? p.set(key, value) : p.delete(key)));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPrice = (key: "precio_min" | "precio_max", value: string, set: (v: string) => void) => {
    set(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam(key, value), 450);
  };

  // Chips de filtros activos (excluye orden por defecto)
  const chips: { label: string; remove: () => void }[] = [];
  if (q) chips.push({ label: `“${q}”`, remove: () => setParam("q", "") });
  if (categoria && CATEGORY_BY_KEY[categoria])
    chips.push({ label: CATEGORY_LABEL[CATEGORY_BY_KEY[categoria]], remove: () => setParam("categoria", "") });
  if (origen) chips.push({ label: `Desde ${origen}`, remove: () => setParam("origen", "") });
  if (params.get("precio_min") || params.get("precio_max")) {
    const a = params.get("precio_min");
    const b = params.get("precio_max");
    chips.push({
      label: a && b ? `US$ ${a}–${b}` : a ? `Desde US$ ${a}` : `Hasta US$ ${b}`,
      remove: () =>
        navigate((p) => {
          p.delete("precio_min");
          p.delete("precio_max");
        }),
    });
  }
  if (orden !== "novedad") chips.push({ label: ORDEN_LABEL[orden] ?? orden, remove: () => setParam("orden", "") });

  const field = "h-9 w-full rounded-lg border border-border bg-background px-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-primary";

  return (
    <div className={`mb-6 transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
        <div>
          <label htmlFor="f-min" className="mb-1 block text-xs font-medium text-muted">
            Precio desde (US$)
          </label>
          <input
            id="f-min"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={min}
            onChange={(e) => setPrice("precio_min", e.target.value, setMin)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-max" className="mb-1 block text-xs font-medium text-muted">
            Hasta (US$)
          </label>
          <input
            id="f-max"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="3000"
            value={max}
            onChange={(e) => setPrice("precio_max", e.target.value, setMax)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-origen" className="mb-1 block text-xs font-medium text-muted">
            Origen
          </label>
          <select id="f-origen" value={origen} onChange={(e) => setParam("origen", e.target.value)} className={field}>
            <option value="">Todos</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-orden" className="mb-1 block text-xs font-medium text-muted">
            Ordenar por
          </label>
          <select id="f-orden" value={orden} onChange={(e) => setParam("orden", e.target.value)} className={field}>
            <option value="novedad">Novedad</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={chip.remove}
              className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/15"
            >
              {chip.label}
              <X className="size-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          <button
            onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
            className="cursor-pointer text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
