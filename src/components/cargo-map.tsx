"use client";

import { useEffect, useState } from "react";
import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { LogisticState } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Mapa REAL del viaje de la carga — reemplaza a la ilustración del barco.
 *
 * Cartografía de verdad (países desde world-atlas / Natural Earth), proyección
 * equirectangular centrada en el Pacífico para ver China y Argentina de una.
 * La ruta trans-Pacífico va sólida (naranja) en el tramo ya recorrido y punteada
 * en lo que falta; un punto marca dónde está realmente la carga según el estado.
 *
 * La geografía y la posición se calculan con d3-geo en el servidor (transform
 * estático), así que con `prefers-reduced-motion` el estado se sigue leyendo sin
 * movimiento. Los contornos de los países se cargan del /public y aparecen encima.
 */

const W = 720;
const H = 300;
const SHANGHAI: [number, number] = [121.47, 31.23];
const DEST: [number, number] = [-58.38, -34.6]; // Buenos Aires — puerta de entrada a AR

// Ruta real Asia → Sudamérica por el Cabo de Buena Esperanza. Longitud decreciente
// (China 121°E → Argentina 58°O), así Argentina queda a la IZQUIERDA y el origen a
// la derecha: la carga viene hacia vos.
const WP: [number, number][] = [
  [121.47, 31.23], // Shanghái
  [110, 8],
  [98, 2], // Malaca
  [72, -12], // Índico
  [48, -30],
  [20, -35], // Cabo de Buena Esperanza
  [-12, -36], // Atlántico Sur
  [-40, -35],
  [-58.38, -34.6], // Buenos Aires
];
const norm = (lon: number) => ((lon + 540) % 360) - 180;

const projection = geoEquirectangular()
  .rotate([-24, 0, 0])
  .scale(150)
  .translate([W / 2, H / 2 + 30]);
const pathFn = geoPath(projection);
const px = (lon: number, lat: number) => projection([norm(lon), lat]) as [number, number];

const STATE_T: Record<LogisticState, number> = {
  PAGADO: 0.04,
  COMPRADO_EN_ORIGEN: 0.12,
  RECIBIDO_DEPOSITO_EXTERIOR: 0.24,
  EMBARCADO: 0.55,
  EN_ADUANA: 0.86,
  ENTREGADO: 1,
  CANCELADO: 0.24,
};

function sampleRaw(frac: number): [number, number][] {
  const segs = WP.length - 1;
  const pos = Math.max(0, Math.min(1, frac)) * segs;
  const pts: [number, number][] = [];
  for (let seg = 0; seg < segs; seg++) {
    const localEnd = Math.min(1, pos - seg);
    if (localEnd <= 0) break;
    const [ax, ay] = WP[seg];
    const [bx, by] = WP[seg + 1];
    const steps = 16;
    for (let s = 0; s <= steps; s++) {
      const u = (s / steps) * localEnd;
      pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
    }
  }
  return pts.length ? pts : [WP[0]];
}

function toPath(frac: number): string {
  return sampleRaw(frac)
    .map((c, i) => {
      const [x, y] = px(c[0], c[1]);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function cargoAt(frac: number): [number, number] {
  const pts = sampleRaw(frac);
  const [lon, lat] = pts[pts.length - 1];
  return px(lon, lat);
}

export function CargoMap({
  state = "EMBARCADO",
  eta,
  className,
}: {
  state?: LogisticState;
  /** Texto corto tipo "faltan ~16 días" para el chip de la carga en viaje. */
  eta?: string;
  className?: string;
}) {
  const [land, setLand] = useState<GeoJSON.Feature[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/geo/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fc = feature(topo, (topo as any).objects.countries) as unknown as GeoJSON.FeatureCollection;
        setLand(fc.features);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const delivered = state === "ENTREGADO";
  const t = STATE_T[state] ?? 0.55;
  const [sx, sy] = px(SHANGHAI[0], SHANGHAI[1]);
  const [ex, ey] = px(DEST[0], DEST[1]);
  const [cx, cy] = cargoAt(t);
  const cargoLabel = state.replace(/_/g, " ");
  const etaLabel = eta?.toUpperCase();
  const pillW = Math.max(cargoLabel.length, etaLabel?.length ?? 0) * 7.6 + 22;
  const pillH = etaLabel ? 34 : 20;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full overflow-visible", className)}
      role="img"
      aria-label={`Mapa del viaje de tu carga, de Shanghái a la Argentina. Estado: ${state
        .replace(/_/g, " ")
        .toLowerCase()}.`}
    >
      <defs>
        <radialGradient id="cargo-map-sea" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stopColor="var(--celeste)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--celeste)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* océano: leve profundidad sobre el navy del hero */}
      <rect x="0" y="0" width={W} height={H} fill="url(#cargo-map-sea)" />

      {/* grilla de carta náutica, muy sutil (sólo se ve sobre el mar) */}
      <path d={pathFn(geoGraticule10()) ?? undefined} fill="none" stroke="var(--celeste)" strokeWidth={0.5} opacity={0.07} />

      {/* tierra: países reales. Aparecen cuando cargó el topojson. */}
      <g>
        {land ? (
          land.map((f, i) => (
            <path
              key={i}
              d={pathFn(f) ?? undefined}
              fill="#17364F"
              stroke="rgba(143,205,235,0.24)"
              strokeWidth={0.6}
            />
          ))
        ) : (
          <rect x="0" y="0" width={W} height={H} fill="var(--celeste)" opacity="0.04" />
        )}
      </g>

      {/* ruta que falta: punteada (el motif del isologo) */}
      <path
        d={toPath(1)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 8"
        opacity="0.45"
        className="traelo-dash"
      />
      {/* ruta recorrida: sólida */}
      {t > 0.01 && (
        <path d={toPath(t)} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      )}

      {/* origen: Shanghái */}
      <circle cx={sx} cy={sy} r="14" fill="var(--celeste)" className="traelo-pulse" style={{ transformOrigin: `${sx}px ${sy}px` }} />
      <circle cx={sx} cy={sy} r="5.5" fill="var(--celeste)" stroke="#0C2136" strokeWidth="1.5" />
      <text x={sx} y={sy - 18} textAnchor="middle" fill="var(--celeste)" fontFamily="var(--font-mono), monospace" fontSize="12.5" letterSpacing="1.5">
        SHANGHÁI
      </text>

      {/* destino: Argentina */}
      {delivered && (
        <circle cx={ex} cy={ey} r="13" fill="none" stroke="var(--accent)" strokeWidth="4" className="cargo-arrive" />
      )}
      <circle cx={ex} cy={ey} r="7" fill={delivered ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="3" />
      {delivered && (
        <path
          d={`M${ex - 3} ${ey} l2.4 2.4 l4.6 -5`}
          fill="none"
          stroke="#F4F6F2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        x={ex + 13}
        y={ey + 5}
        textAnchor="start"
        fill="var(--accent)"
        fontFamily="var(--font-mono), monospace"
        fontSize="12.5"
        letterSpacing="1.5"
      >
        {delivered ? "ENTREGADA" : "ARGENTINA"}
      </text>

      {/* la carga: dónde va realmente (oculta al entregar: ya llegó) */}
      {!delivered && (
        <g>
          <circle cx={cx} cy={cy} r="13" fill="var(--accent)" opacity="0.25" className="traelo-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }} />
          <circle cx={cx} cy={cy} r="6" fill="var(--accent)" stroke="#F4F6F2" strokeWidth="2" />
          <g transform={`translate(${cx}, ${cy + 14})`}>
            <rect x={-pillW / 2} y={0} width={pillW} height={pillH} rx={10} fill="rgba(12,33,54,0.82)" stroke="rgba(255,90,31,0.55)" strokeWidth={1} />
            <text
              x={0}
              y={14}
              textAnchor="middle"
              fill="#F4F6F2"
              fontFamily="var(--font-mono), monospace"
              fontSize="10.5"
              letterSpacing="1.5"
            >
              {cargoLabel}
            </text>
            {etaLabel && (
              <text
                x={0}
                y={27}
                textAnchor="middle"
                fill="var(--accent)"
                fontFamily="var(--font-mono), monospace"
                fontSize="9.5"
                letterSpacing="1"
              >
                {etaLabel}
              </text>
            )}
          </g>
        </g>
      )}
    </svg>
  );
}
