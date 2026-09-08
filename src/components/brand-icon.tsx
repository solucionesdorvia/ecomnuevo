// Set de iconos de marca "traelo. v1": duotono — relleno celeste + trazo
// currentColor (tinta oceánica sobre claro, celeste sobre navy). Trazo grueso y
// redondeado, en línea con las categorías (category-icon.tsx). SIN naranja: ese
// color queda reservado para precio final, badges de ahorro, CTA y el punto de
// la marca. Un solo lenguaje para toda la app.

const SOFT = "var(--celeste)";

export type BrandIconName =
  | "barco"
  | "bulto"
  | "precio"
  | "nombre"
  | "pago"
  | "track"
  | "fabrica"
  | "peso";

export function BrandIcon({ name, className }: { name: BrandIconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };
  const st = {
    stroke: "currentColor",
    strokeWidth: 3.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "barco":
      return (
        <svg {...common}>
          <path d="M8 29h32l-3.2 8.2a2 2 0 0 1-1.9 1.3H13.1a2 2 0 0 1-1.9-1.3z" fill={SOFT} />
          <rect x="12.5" y="19.5" width="8" height="9.5" rx="1.6" fill={SOFT} />
          <rect x="21.5" y="19.5" width="8" height="9.5" rx="1.6" fill={SOFT} />
          <rect x="17" y="11" width="8" height="8.5" rx="1.6" fill={SOFT} />
          <path d="M8 29h32l-3.2 8.2a2 2 0 0 1-1.9 1.3H13.1a2 2 0 0 1-1.9-1.3z" {...st} />
          <rect x="12.5" y="19.5" width="8" height="9.5" rx="1.6" {...st} />
          <rect x="21.5" y="19.5" width="8" height="9.5" rx="1.6" {...st} />
          <rect x="17" y="11" width="8" height="8.5" rx="1.6" {...st} />
          <path d="M32.5 19.5v-6h4v6" {...st} />
        </svg>
      );
    case "bulto":
      return (
        <svg {...common}>
          <path d="M24 8.5 39 16v16L24 39.5 9 32V16z" fill={SOFT} />
          <path d="M24 8.5 39 16v16L24 39.5 9 32V16z" {...st} />
          <path d="M9 16 24 23.5 39 16M24 23.5V39.5M16.5 12.2 31.5 19.8" {...st} />
        </svg>
      );
    case "precio":
      return (
        <svg {...common}>
          <path
            d="M22 8h14a4 4 0 0 1 4 4v14a3 3 0 0 1-.88 2.12L26.12 40.12a3 3 0 0 1-4.24 0L7.88 26.12a3 3 0 0 1 0-4.24L21.88 8.9A3 3 0 0 1 22 8z"
            fill={SOFT}
          />
          <path
            d="M22 8h14a4 4 0 0 1 4 4v14a3 3 0 0 1-.88 2.12L26.12 40.12a3 3 0 0 1-4.24 0L7.88 26.12a3 3 0 0 1 0-4.24L21.88 8.9A3 3 0 0 1 22 8z"
            {...st}
          />
          <circle cx="32" cy="16" r="3" fill="#fff" {...st} />
        </svg>
      );
    case "nombre":
      return (
        <svg {...common}>
          <path d="M14 7h12l8 8v24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill={SOFT} />
          <path d="M14 7h12l8 8v24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" {...st} />
          <path d="M26 7v8h8" {...st} />
          <path d="M18 28.5l3.5 3.5 7-8" {...st} />
        </svg>
      );
    case "pago":
      return (
        <svg {...common}>
          <path d="M24 7 38 12v9.5c0 9-6 14.5-14 18-8-3.5-14-9-14-18V12z" fill={SOFT} />
          <path d="M24 7 38 12v9.5c0 9-6 14.5-14 18-8-3.5-14-9-14-18V12z" {...st} />
          <path d="M18 23l4.2 4.2L31 18.5" {...st} />
        </svg>
      );
    case "track":
      return (
        <svg {...common}>
          <path
            d="M24 7a11 11 0 0 1 11 11c0 8.2-8.4 18.3-10.4 20.6a.8.8 0 0 1-1.2 0C21.4 36.3 13 26.2 13 18A11 11 0 0 1 24 7z"
            fill={SOFT}
          />
          <path
            d="M24 7a11 11 0 0 1 11 11c0 8.2-8.4 18.3-10.4 20.6a.8.8 0 0 1-1.2 0C21.4 36.3 13 26.2 13 18A11 11 0 0 1 24 7z"
            {...st}
          />
          <circle cx="24" cy="18" r="4.3" fill="#fff" {...st} />
        </svg>
      );
    case "fabrica":
      return (
        <svg {...common}>
          <path d="M8 40V23l9 5.5v-5.5l9 5.5V16h4v24a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" fill={SOFT} />
          <path d="M8 40V23l9 5.5v-5.5l9 5.5V16h4v24a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" {...st} />
          <path d="M31 16V9h5v7" {...st} />
        </svg>
      );
    case "peso":
      return (
        <svg {...common}>
          <path d="M13.4 19h21.2l2.7 18.7a2.4 2.4 0 0 1-2.4 2.8H13.1a2.4 2.4 0 0 1-2.4-2.8z" fill={SOFT} />
          <path d="M13.4 19h21.2l2.7 18.7a2.4 2.4 0 0 1-2.4 2.8H13.1a2.4 2.4 0 0 1-2.4-2.8z" {...st} />
          <path d="M18 19v-2.5a6 6 0 0 1 12 0V19" {...st} />
        </svg>
      );
    default:
      return null;
  }
}
