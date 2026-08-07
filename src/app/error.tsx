"use client";

import { RefreshCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <TriangleAlert className="size-12 text-amber-500" />
      <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Algo salió mal de nuestro lado</h1>
      <p className="max-w-md text-muted">
        No es tu culpa: fue un error nuestro y no se te cobró nada. Probá de nuevo; si
        sigue pasando, avisanos.
      </p>
      <button
        onClick={reset}
        className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        <RefreshCcw className="size-4" /> Reintentar
      </button>
    </div>
  );
}
