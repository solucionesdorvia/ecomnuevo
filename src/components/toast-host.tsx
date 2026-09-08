"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";

// Toasts branded del sistema "traelo v1". El estado vive en un STORE a nivel
// módulo (no en useState) a propósito: así los toasts sobreviven a los
// router.refresh() que dispara el tiempo real (si vivieran en el estado del
// componente, el refresh los borraría y el toast apenas parpadearía).

export type ToastInput = {
  title: string;
  body?: string;
  href?: string;
  icon?: string;
  tone?: "success" | "danger";
};
type Toast = ToastInput & { id: number };

// El tono se distingue por el color del chip del icono (+ el emoji), sin borde
// lateral de color (que lee como "UI generada por IA").
const TONE = {
  success: "rgba(31,169,122,.20)",
  danger: "rgba(239,68,68,.20)",
  default: "rgba(143,205,235,.16)",
} as const;

const EVENT = "traelo:toast";
const TTL = 6500;

// ── Store módulo ──
let store: Toast[] = [];
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

function push(input: ToastInput) {
  if (!input?.title) return;
  const id = Date.now() + Math.random();
  store = [...store, { ...input, id }].slice(-4);
  notify();
  setTimeout(() => {
    store = store.filter((t) => t.id !== id);
    notify();
  }, TTL);
}

function remove(id: number) {
  store = store.filter((t) => t.id !== id);
  notify();
}

export function showToast(t: ToastInput) {
  if (typeof window !== "undefined") push(t);
}

export function ToastHost() {
  const [, force] = useReducer((n: number) => n + 1, 0);
  const router = useRouter();

  useEffect(() => {
    subs.add(force);
    const onEvent = (e: Event) => push((e as CustomEvent<ToastInput>).detail);
    window.addEventListener(EVENT, onEvent);
    return () => {
      subs.delete(force);
      window.removeEventListener(EVENT, onEvent);
    };
  }, []);

  if (store.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]">
      {store.map((t) => {
        const chip = TONE[t.tone ?? "default"];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-celeste/25 bg-primary px-4 py-3 text-white shadow-xl"
            style={{ animation: "toast-in .28s cubic-bezier(.16,1,.3,1)" }}
          >
            <span
              aria-hidden
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-lg"
              style={{ background: chip }}
            >
              {t.icon ?? "🔔"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (t.href) router.push(t.href);
                remove(t.id);
              }}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <span className="block font-display text-sm font-extrabold leading-tight tracking-[-0.01em]">
                {t.title}
              </span>
              {t.body && <span className="mt-0.5 block text-xs text-celeste-soft">{t.body}</span>}
            </button>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => remove(t.id)}
              className="shrink-0 cursor-pointer rounded-md px-1 text-celeste-soft/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
