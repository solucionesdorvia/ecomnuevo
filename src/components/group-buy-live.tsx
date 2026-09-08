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

  // Polling: ver bajar el precio cuando se suma gente (en cualquier pantalla).
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

  // Countdown vivo.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Demo: simular que se suma gente cada ~3.5s.
  useEffect(() => {
    if (!sim) return;
    const t = setInterval(() => {
      simularSuma(initial.id).then((s) => {
        if (s) {
          setNames((prev) => prev);
          apply(s);
        }
      });
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
      {/* Panel de precio en vivo */}
      <div className="overflow-hidden rounded-2xl bg-primary p-5 text-white sm:p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-celeste">Precio en vivo</p>
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono-ui text-[11px] text-celeste-soft">
            zarpa en {countdown(state.closesAt)}
          </span>
        </div>

        <div className="mt-2 flex items-end gap-3">
          <span
            className="font-display text-5xl font-extrabold tracking-[-0.04em] text-accent transition-all sm:text-6xl"
            style={{ animation: "toast-in .3s ease-out" }}
            key={state.priceUsd}
          >
            {formatUsd(state.priceUsd)}
          </span>
          {saved > 0 && (
            <span className="mb-1.5 flex flex-col leading-tight">
              <span className="font-mono-ui text-sm text-celeste-soft line-through">
                {formatUsd(state.basePriceUsd)}
              </span>
              <span className="font-mono-ui text-[11px] text-success">
                −{formatUsd(saved)} c/u
              </span>
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-celeste-soft">
          {state.next
            ? `Faltan ${state.next.minUnits - state.units} para que baje a ${formatUsd(state.next.priceUsd)}.`
            : "¡Precio mínimo desbloqueado! Sigue bajando el flete por unidad."}
        </p>

        {/* Contenedor llenándose */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between font-mono-ui text-[11px] text-celeste-soft">
            <span>Contenedor</span>
            <span>
              {state.units} / {state.goalUnits} unidades
            </span>
          </div>
          <div className="relative h-7 overflow-hidden rounded-lg border border-celeste/30 bg-primary-2">
            <div
              className="h-full bg-gradient-to-r from-accent to-[#ff7a45] transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(fill, 3)}%` }}
            />
            {/* marcas de los escalones */}
            {tiers.slice(1).map((t) => (
              <span
                key={t.minUnits}
                className="absolute top-0 h-full border-l border-dashed border-white/40"
                style={{ left: `${Math.min((t.minUnits / state.goalUnits) * 100, 100)}%` }}
                title={`${t.minUnits} → ${formatUsd(t.priceUsd)}`}
              >
                <span className="absolute -top-0.5 left-1 font-mono-ui text-[9px] text-white/70">
                  {formatUsd(t.priceUsd)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {names.slice(0, 6).map((p, i) => (
              <span
                key={i}
                className="grid size-7 place-items-center rounded-full border-2 border-primary bg-celeste text-[11px] font-bold text-primary"
              >
                {initials(p.name)}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1.5 text-sm text-celeste-soft">
            <Users className="size-4" /> {state.participants} personas ya se sumaron
          </span>
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

      {/* Cómo funciona */}
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { t: "Más gente, más barato", d: "El flete por barco se reparte entre todos." },
          { t: "Cerramos y zarpa", d: "Al llenarse o vencer, se fija el precio final." },
          { t: "Cero riesgo", d: "Pagás recién cuando cierra, al precio ya desbloqueado." },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3">
            <p className="font-mono-ui text-[11px] text-accent">0{i + 1}</p>
            <p className="mt-1 text-sm font-semibold text-primary">{s.t}</p>
            <p className="mt-0.5 text-xs text-muted">{s.d}</p>
          </div>
        ))}
      </div>

      {/* Control de demo */}
      <label className="flex cursor-pointer items-center justify-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={sim} onChange={(e) => setSim(e.target.checked)} className="accent-accent" />
        Demo: simular gente sumándose (el precio baja solo)
      </label>
    </div>
  );
}
