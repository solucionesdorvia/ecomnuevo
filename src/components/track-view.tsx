"use client";

import { useEffect, useRef } from "react";
import { registerProductView } from "@/actions/vistos";

/** Registra la visita al producto (para "Seguí mirando" de la home). */
export function TrackView({ slug }: { slug: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void registerProductView(slug);
  }, [slug]);
  return null;
}
