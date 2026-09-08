"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Toasts branded del sistema "traelo v1". Se disparan desde cualquier lado con
// showToast(...) (via CustomEvent, sin acoplar componentes). Navy, se apilan,
// se auto-cierran y son clickeables si traen href.

export type ToastInput = { title: string; body?: string; href?: string; icon?: string };
type Toast = ToastInput & { id: number };

const EVENT = "traelo:toast";
const TTL = 6500;

export function showToast(t: ToastInput) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: t }));
  }
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastInput>).detail;
      if (!detail?.title) return;
      const id = Date.now() + Math.random();
      setToasts((cur) => [...cur, { ...detail, id }].slice(-4));
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), TTL);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (toasts.length === 0) return null;

  const dismiss = (id: number) => setToasts((cur) => cur.filter((t) => t.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-celeste/25 bg-primary px-4 py-3 text-white shadow-xl"
          style={{ animation: "toast-in .28s cubic-bezier(.16,1,.3,1)" }}
        >
          <span
            aria-hidden
            className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-lg"
            style={{ background: "rgba(143,205,235,.16)" }}
          >
            {t.icon ?? "🔔"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (t.href) router.push(t.href);
              dismiss(t.id);
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
            onClick={() => dismiss(t.id)}
            className="shrink-0 cursor-pointer rounded-md px-1 text-celeste-soft/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
