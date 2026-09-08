import type { Metadata } from "next";
import Link from "next/link";
import { Marquee } from "@/components/marquee";
import { RouteLine } from "@/components/route-line";

export const metadata: Metadata = {
  title: "Para tu negocio",
  description:
    "Importá por volumen sin volverte despachante. Traelo consolida, despacha e importa a tu nombre — un solo precio final por pedido de hasta 50 kg y US$ 3.000.",
};

const FEATURES = [
  {
    t: "Precio final por bulto",
    d: "Sabés el costo total antes de comprar —producto, flete marítimo e impuestos incluidos—. Cero sorpresas en la aduana, cero costos ocultos que arruinen el margen.",
  },
  {
    t: "Consolidamos tu volumen",
    d: "Juntamos varios productos en un mismo envío, bajo régimen courier: hasta 50 kg y US$ 3.000 por pedido. Traés más, en menos viajes.",
  },
  {
    t: "Importás a tu nombre, sin trámite",
    d: "El comprador es el importador. Nosotros hacemos la parte pesada: compra en fábrica, despacho, aduana y logística, puerta a puerta.",
  },
  {
    t: "Seguimiento de punta a punta",
    d: "Tracking de 6 estados desde que sale de la fábrica hasta tu depósito. Sabés siempre dónde está tu carga.",
  },
];

export default function ParaTuNegocioPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="fullbleed bg-primary text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-14 lg:px-14 lg:py-20">
          <div>
            <p className="eyebrow text-celeste">Para tu negocio</p>
            <h1 className="mt-4 font-display text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] sm:text-5xl lg:text-[68px] lg:leading-[0.98]">
              Traé para tu negocio,
              <br />
              <span className="text-accent">sin volverte despachante.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-celeste-soft lg:mt-6 lg:text-[19px]">
              Comprás directo de fábrica en dólares. Nosotros consolidamos, despachamos por barco
              e importamos a tu nombre. Un solo precio final por cada pedido de hasta 50 kg y
              US$ 3.000 — para que reponer mercadería sea previsible.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 lg:mt-8">
              <Link
                href="/catalogo"
                className="rounded-[10px] bg-accent px-7 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Ver catálogo →
              </Link>
              <Link
                href="/#como-funciona"
                className="rounded-[10px] border border-celeste/45 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/5"
              >
                Cómo funciona
              </Link>
            </div>
          </div>
          <div className="lg:pl-6">
            <RouteLine className="w-full" />
          </div>
        </div>
      </section>

      {/* ── Franja de datos ──────────────────────────────────── */}
      <Marquee className="fullbleed" />

      {/* ── Por qué importar con Traelo ──────────────────────── */}
      <section className="fullbleed bg-background">
        <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-14 lg:py-20">
          <h2 className="max-w-3xl font-display text-3xl font-extrabold tracking-[-0.03em] text-primary lg:text-[44px]">
            Pensado para traer en serio, no para probar suerte.
          </h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:mt-16">
            {FEATURES.map((f) => (
              <div key={f.t}>
                <div className="h-[3px] w-10 rounded-full bg-accent" />
                <h3 className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em] text-primary lg:text-2xl">
                  {f.t}
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Las reglas del courier, claras ───────────────────── */}
      <section className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-14 lg:px-14 lg:py-20">
          <p className="eyebrow text-celeste">Las reglas, sin letra chica</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-[-0.03em] lg:text-[40px]">
            El régimen courier, en tres números.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { n: "50 kg", d: "el peso máximo por pedido, por destinatario. Pensá cada compra como un bulto que entra derecho." },
              { n: "US$ 3.000", d: "el tope de valor por pedido. Por encima, se divide en varios — nosotros te lo ordenamos." },
              { n: "~60 días", d: "lo que tarda el viaje por barco, consolidado. Planificás la reposición con tiempo." },
            ].map((s) => (
              <div key={s.n} className="border-t border-celeste/25 pt-5">
                <p className="font-display text-5xl font-extrabold tracking-[-0.04em] text-accent lg:text-6xl">
                  {s.n}
                </p>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-celeste-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="fullbleed bg-background">
        <div className="mx-auto max-w-[1440px] px-4 py-16 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-display text-3xl font-extrabold tracking-[-0.03em] text-primary lg:text-[46px]">
              Armá tu primer pedido para el negocio.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-muted">
              Elegí de fábrica, sumá al carrito y mirá el precio final por bulto antes de pagar.
              Sin cuenta, sin fricción.
            </p>
            <Link
              href="/catalogo"
              className="mt-8 inline-block rounded-[10px] bg-accent px-8 py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Ver el catálogo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
