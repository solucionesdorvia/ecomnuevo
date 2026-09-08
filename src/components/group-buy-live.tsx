"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Users, Link2, Check } from "lucide-react";
import type { GroupBuyState, Tier } from "@/lib/colectiva";
import { joinGroupBuy, simularSuma } from "@/actions/colectiva";
import { showToast } from "@/components/toast-host";
import { formatUsd } from "@/lib/format";

const POLL = 3000;

function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "cerrando";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function initials(name: string) {
  return name.replace(/[^a-zA-ZÀ-ÿ ]/g, "").trim().slice(0, 1).toUpperCase() || "·";
}

export function GroupBuyLive({
  initial,
  tiers,
  recent,
}: {
  initial: GroupBuyState;
  tiers: Tier[];
  recent: { name: string; units: number }[];
}) {
  const [state, setState] = useState(initial);
  const [names, setNames] = useState(recent);
  const [joined, setJoined] = useState(false);
  const [sim, setSim] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, tick] = useState(0);
  const [pending, start] = useTransition();
  const prevPrice = useRef(initial.priceUsd);

  const apply = (s: GroupBuyState | null) => {
    if (!s) return;
    if (s.priceUsd < prevPrice.current) {
      showToast({
        icon: "🎉",
        title: `¡Bajó a ${formatUsd(s.priceUsd)}!`,
        body: "Cuantos más somos, más barato para todos.",
        tone: "success",
      });
    }
    prevPrice.current = s.priceUsd;
    setState(s);
  };

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/colectiva/${initial.id}`, { cache: "no-store" });
        if (r.ok && alive) apply(await r.json());
      } catch {}
    };
    const t = setInterval(poll, POLL);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sim) return;
    const t = setInterval(() => {
      simularSuma(initial.id).then((s) => s && apply(s));
    }, 3500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, initial.id]);

  const join = () =>
    start(async () => {
      const s = await joinGroupBuy(initial.id, 1);
      if (s) {
        setJoined(true);
        setNames((prev) => [{ name: "Vos", units: 1 }, ...prev].slice(0, 10));
        apply(s);
      }
    });

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const fill = Math.min(state.units / state.goalUnits, 1) * 100;
  const saved = state.basePriceUsd - state.priceUsd;

  return (
    <div className="flex flex-col gap-4">
      {/* HERO — el contenedor que se llena y el precio en vivo */}
      <div className="overflow-hidden rounded-2xl bg-primary p-5 text-white sm:p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-mono-ui text-[11px] uppercase tracking-wide text-celeste">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            En vivo
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono-ui text-[11px] text-celeste-soft">
            zarpa en {countdown(state.closesAt)}
          </span>
        </div>

        {/* Precio a máxima fuerza, a todo lo ancho */}
        <div className="mt-3">
          <span
            key={state.priceUsd}
            className="block font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.05em] text-accent sm:text-6xl"
            style={{ animation: "price-pop .45s cubic-bezier(.16,1,.3,1)" }}
          >
            {formatUsd(state.priceUsd)}
          </span>
          {saved > 0 && (
            <span className="mt-2 flex items-center gap-2">
              <span className="font-mono-ui text-sm text-celeste-soft line-through">
                {formatUsd(state.basePriceUsd)}
              </span>
              <span className="rounded-md bg-success/20 px-2 py-0.5 font-mono-ui text-[11px] font-bold text-success">
                −{formatUsd(saved)} c/u
              </span>
            </span>
          )}
          <p className="mt-3 text-sm text-celeste-soft">
            {state.next ? (
              <>
                Faltan <b className="text-white">{state.next.minUnits - state.units}</b> para que baje a{" "}
                <b className="text-accent">{formatUsd(state.next.priceUsd)}</b>.
              </>
            ) : (
              "Precio mínimo desbloqueado. Sigue bajando el flete por unidad."
            )}
          </p>
        </div>

        {/* Contenedor cargándose + quiénes se sumaron */}
        <div className="mt-5 flex items-center gap-5 border-t border-white/10 pt-5">
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative h-40 w-24 overflow-hidden rounded-xl border-2 border-celeste/40 bg-primary-2">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(143,205,235,.14) 0 1px, transparent 1px 11px)",
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out"
                style={{ height: `${Math.max(fill, 4)}%`, background: "linear-gradient(180deg,#ff8a5a,#FF5A1F)" }}
              >
                <div className="absolute inset-x-0 -top-px h-1.5 bg-white/25" />
              </div>
              {tiers.slice(1).map((t) => {
                const pos = Math.min((t.minUnits / state.goalUnits) * 100, 100);
                const reached = fill >= pos - 0.5;
                return (
                  <div
                    key={t.minUnits}
                    className="absolute inset-x-0 flex items-center gap-1 px-1.5"
                    style={{ bottom: `${pos}%` }}
                  >
                    <span
                      className={`h-0 flex-1 border-t ${reached ? "border-white/70" : "border-dashed border-celeste/40"}`}
                    />
                    <span
                      className={`font-mono-ui text-[9px] font-bold ${reached ? "text-white" : "text-celeste-soft"}`}
                    >
                      {formatUsd(t.priceUsd)}
                    </span>
                  </div>
                );
              })}
              <span className="absolute left-1 top-1 size-1.5 rounded-[1px] bg-celeste/50" />
              <span className="absolute right-1 top-1 size-1.5 rounded-[1px] bg-celeste/50" />
            </div>
            <p className="mt-2 font-mono-ui text-[10px] text-celeste-soft">
              {state.units}/{state.goalUnits}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono-ui text-[11px] uppercase tracking-wide text-celeste">El contenedor</p>
            <p className="mt-1 text-sm text-celeste-soft">
              Se llena y zarpa. Ya viajan <b className="text-white">{state.units}</b> unidades de{" "}
              {state.goalUnits}.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                {names.slice(0, 5).map((p, i) => (
                  <span
                    key={i}
                    className="grid size-7 place-items-center rounded-full border-2 border-primary bg-celeste text-[11px] font-bold text-primary"
                  >
                    {initials(p.name)}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1.5 text-sm text-celeste-soft">
                <Users className="size-4" /> <b className="text-white">{state.participants}</b> se sumaron
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA + viral */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <button
          type="button"
          onClick={join}
          disabled={pending || joined}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {joined ? (
            <>
              <Check className="size-5" /> ¡Ya estás en el contenedor!
            </>
          ) : (
            `Sumate — ${formatUsd(state.priceUsd)}`
          )}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Reservás tu lugar. Pagás recién cuando el contenedor cierra, al precio final.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-primary hover:bg-background"
        >
          {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
          {copied ? "Link copiado" : "Invitá y bajás el precio para todos"}
        </button>
      </div>

      <p className="text-center text-xs leading-relaxed text-muted">
        Más gente, más barato · pagás recién cuando cierra, al precio final · viaja por barco, sin
        sorpresas en la aduana.
      </p>

      <label className="flex cursor-pointer items-center justify-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={sim} onChange={(e) => setSim(e.target.checked)} className="accent-accent" />
        Demo: simular gente sumándose (el precio baja solo)
      </label>
    </div>
  );
}
