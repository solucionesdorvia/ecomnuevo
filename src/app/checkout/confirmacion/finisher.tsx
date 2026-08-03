"use client";

import { useEffect, useRef } from "react";
import { finishPurchase } from "@/actions/checkout";

/** Dispara el cierre de compra (vaciar carrito + redirect) una sola vez. */
export function Finisher({ orderId }: { orderId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void finishPurchase(orderId);
  }, [orderId]);
  return null;
}
