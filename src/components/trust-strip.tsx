import { BrandIcon, type BrandIconName } from "@/components/brand-icon";

// Señales de confianza cerca del CTA: el momento donde el cliente decide
// comprarle a una marca que no conoce. Refuerza, no decora.
const ITEMS: { icon: BrandIconName; title: string; text: string }[] = [
  {
    icon: "precio",
    title: "Precio final garantizado",
    text: "Sin sorpresas en Aduana. No pagás nada al recibirlo.",
  },
  {
    icon: "nombre",
    title: "Entra a tu nombre",
    text: "Sos el importador: tu compra ingresa legal y transparente.",
  },
  {
    icon: "track",
    title: "Seguimiento en cada paso",
    text: "Te avisamos por email desde que compramos hasta que llega.",
  },
  {
    icon: "pago",
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
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-primary"
              style={{ background: "color-mix(in srgb, var(--celeste) 24%, white)" }}
            >
              <BrandIcon name={it.icon} className="size-6" />
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
