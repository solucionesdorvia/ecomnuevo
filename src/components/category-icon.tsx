// Avatars de categoría hechos a medida para Traelo: duotono en la paleta de
// marca (relleno celeste + trazo tinta oceánica). Sin naranja: ese color queda
// reservado para precio final, CTA y el punto de la marca.

const SOFT = "var(--celeste)";

export function CategoryIcon({ k, className }: { k: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 3.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (k) {
    case "electronica":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="7" y="27" width="9.5" height="14" rx="4.75" fill={SOFT} />
          <rect x="31.5" y="27" width="9.5" height="14" rx="4.75" fill={SOFT} />
          <path d="M11 29.5v-3.5a13 13 0 0 1 26 0v3.5" {...stroke} />
          <rect x="7" y="27" width="9.5" height="14" rx="4.75" {...stroke} />
          <rect x="31.5" y="27" width="9.5" height="14" rx="4.75" {...stroke} />
        </svg>
      );
    case "hogar":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M10 23 24 11.5 38 23v14a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z" fill={SOFT} />
          <path d="M7.5 24.5 24 11l16.5 13.5" {...stroke} />
          <path d="M11 22v15a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V22" {...stroke} />
          <path d="M20 39v-8.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V39" {...stroke} />
        </svg>
      );
    case "indumentaria":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M18.5 9.5 10 15l4 7 3.5-2v18.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V20l3.5 2 4-7-8.5-5.5c-.4 3-3.4 5-6 5s-5.6-2-6-5z"
            fill={SOFT}
          />
          <path
            d="M18.5 9.5 10 15l4 7 3.5-2v18.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V20l3.5 2 4-7-8.5-5.5c-.4 3-3.4 5-6 5s-5.6-2-6-5z"
            {...stroke}
          />
        </svg>
      );
    case "herramientas":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M29.4 12.6a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0l7.5-7.5a12 12 0 0 1-15.9 15.9L13.2 40.8a4.24 4.24 0 0 1-6-6l13.8-13.8A12 12 0 0 1 36.9 5.1z"
            fill={SOFT}
          />
          <path
            d="M29.4 12.6a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0l7.5-7.5a12 12 0 0 1-15.9 15.9L13.2 40.8a4.24 4.24 0 0 1-6-6l13.8-13.8A12 12 0 0 1 36.9 5.1z"
            {...stroke}
          />
        </svg>
      );
    default:
      return null;
  }
}
