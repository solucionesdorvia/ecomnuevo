import {
  MAX_TOTAL_USD,
  MAX_UNITS_PER_SPECIES,
  MAX_VOLUME_M3,
  MAX_WEIGHT_KG,
  type CourierCheck,
} from "@/lib/courier";
import { formatKg, formatM3, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

function Bar({ ratio, over }: { ratio: number; over: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
      <div
        className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : ratio > 0.8 ? "bg-amber-500" : "bg-success")}
        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
      />
    </div>
  );
}

/** Barras de progreso contra los topes por pedido (US$ 3.000 / 50 kg del régimen courier + 1 m³ de Traelo). */
export function CourierMeter({ check }: { check: CourierCheck }) {
  const overUsd = check.totalUsd > MAX_TOTAL_USD;
  const overKg = check.totalWeightKg > MAX_WEIGHT_KG;
  const overM3 = check.totalVolumeM3 > MAX_VOLUME_M3;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-medium">Topes por pedido</p>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Valor: {formatUsd(check.totalUsd)}</span>
          <span>tope {formatUsd(MAX_TOTAL_USD)}</span>
        </div>
        <Bar ratio={check.usdRatio} over={overUsd} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Peso: {formatKg(check.totalWeightKg)}</span>
          <span>tope {formatKg(MAX_WEIGHT_KG)}</span>
        </div>
        <Bar ratio={check.weightRatio} over={overKg} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Volumen: {formatM3(check.totalVolumeM3)}</span>
          <span>tope {formatM3(MAX_VOLUME_M3)}</span>
        </div>
        <Bar ratio={check.volumeRatio} over={overM3} />
      </div>
      {check.errors.length > 0 ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {check.errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Tu compra entra al país a tu nombre: por eso cada pedido tiene un tope de{" "}
          {MAX_WEIGHT_KG} kg, {formatUsd(MAX_TOTAL_USD)} y hasta {MAX_UNITS_PER_SPECIES} unidades por
          producto (régimen puerta a puerta). Además, cada pedido ocupa hasta {formatM3(MAX_VOLUME_M3)} en el
          contenedor: si necesitás más, hacés otro pedido.
        </p>
      )}
    </div>
  );
}
