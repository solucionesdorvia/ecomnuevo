import { BadgeCheck, Lock, Ship, ShieldCheck } from "lucide-react";

// Señales de confianza cerca del CTA: el momento donde el cliente decide
// comprarle a una marca que no conoce. Refuerza, no decora.
const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Precio final garantizado",
    text: "Sin sorpresas en Aduana. No pagás nada al recibirlo.",
  },
  {
    icon: BadgeCheck,
    title: "Entra a tu nombre",
    text: "Sos el importador: tu compra ingresa legal y transparente.",
  },
  {
    icon: Ship,
    title: "Seguimiento en cada paso",
    text: "Te avisamos por email desde que compramos hasta que llega.",
  },
  {
    icon: Lock,
    title: "Pago seguro",
    text: "Procesado de forma segura. No guardamos tu tarjeta.",
  },
];

export function TrustStrip() {
  return (
    <section aria-label="Garantías de compra" className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <ul className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <li key={it.title} className="flex gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "color-mix(in srgb, var(--celeste) 24%, white)" }}
            >
              <it.icon className="size-5 text-foreground" />
            </span>
            <div>
              <p className="text-sm font-semibold">{it.title}</p>
              <p className="text-xs leading-snug text-muted">{it.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
