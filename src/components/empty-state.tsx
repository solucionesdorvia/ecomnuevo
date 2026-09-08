import Link from "next/link";
import { BrandIcon, type BrandIconName } from "@/components/brand-icon";

/**
 * Estado vacío del sistema "traelo. v1": card con borde punteado, icono branded
 * en chip celeste, título en Bricolage y (opcional) CTA naranja. Copy directo.
 * `icon` usa el set de marca; `emoji` queda como override para casos puntuales.
 */
export function EmptyState({
  icon = "barco",
  emoji,
  title,
  subtitle,
  cta,
  dark = false,
}: {
  icon?: BrandIconName | null;
  emoji?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-[10px] bg-primary px-6 py-12 text-center text-white"
          : "rounded-[10px] border border-dashed border-primary/25 bg-surface px-6 py-12 text-center"
      }
    >
      {icon ? (
        <span
          className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${dark ? "text-celeste" : "text-primary"}`}
          style={{ background: dark ? "rgba(143,205,235,.16)" : "color-mix(in srgb, var(--celeste) 24%, white)" }}
        >
          <BrandIcon name={icon} className="size-9" />
        </span>
      ) : emoji ? (
        <div className="text-3xl">{emoji}</div>
      ) : null}
      <p
        className={`mt-3 font-display text-2xl font-extrabold tracking-[-0.02em] ${dark ? "text-white" : "text-primary"}`}
      >
        {title}
      </p>
      {subtitle && (
        <p className={`mx-auto mt-2 max-w-sm text-sm ${dark ? "text-celeste-soft" : "text-muted"}`}>{subtitle}</p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
