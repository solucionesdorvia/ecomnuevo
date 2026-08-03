"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProduct, type AdminFormState } from "@/actions/admin";
import { formatUsd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";

export type ProductFormData = {
  id?: string;
  referencePriceUsd: number | null;
  title: string;
  description: string;
  category: string;
  supplierId: string;
  images: string[];
  weightKg: number;
  volumeM3: number;
  costUsd: number;
  freightUsd: number;
  taxesUsd: number;
  marginUsd: number;
  priceUsd: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  featured: boolean;
  active: boolean;
  variantKind: string;
  variantValues: string;
};

const EMPTY: ProductFormData = {
  referencePriceUsd: null,
  title: "",
  description: "",
  category: "ELECTRONICA",
  supplierId: "",
  images: [],
  weightKg: 0,
  volumeM3: 0,
  costUsd: 0,
  freightUsd: 0,
  taxesUsd: 0,
  marginUsd: 0,
  priceUsd: 0,
  deliveryDaysMin: 45,
  deliveryDaysMax: 60,
  featured: false,
  active: true,
  variantKind: "",
  variantValues: "",
};

export function ProductForm({
  product,
  suppliers,
}: {
  product?: ProductFormData;
  suppliers: { id: string; name: string; country: string }[];
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveProduct, {});
  const initial = product ?? EMPTY;

  // Desglose editable con precio sugerido en vivo
  const [cost, setCost] = useState(initial.costUsd);
  const [freight, setFreight] = useState(initial.freightUsd);
  const [taxes, setTaxes] = useState(initial.taxesUsd);
  const [margin, setMargin] = useState(initial.marginUsd);
  const [price, setPrice] = useState(initial.priceUsd);

  const suggested = useMemo(
    () => Math.round((cost + freight + taxes + margin) * 100) / 100,
    [cost, freight, taxes, margin],
  );

  const numField = (
    label: string,
    name: string,
    value: number,
    set: (n: number) => void,
    step = "0.01",
  ) => (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step}
        min={0}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => set(Number(e.target.value))}
        required
      />
    </div>
  );

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 font-semibold">Datos del producto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={initial.title} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={initial.description} required />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select id="category" name="category" defaultValue={initial.category}>
              <option value="ELECTRONICA">Electrónica</option>
              <option value="HOGAR">Hogar</option>
              <option value="INDUMENTARIA">Indumentaria</option>
              <option value="HERRAMIENTAS">Herramientas</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="supplierId">Proveedor</Label>
            <Select id="supplierId" name="supplierId" defaultValue={initial.supplierId} required>
              <option value="" disabled>
                Elegí…
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.country})
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="images">Fotos (una URL por línea)</Label>
            <Textarea id="images" name="images" rows={3} defaultValue={initial.images.join("\n")} required />
          </div>
          <div>
            <Label htmlFor="variantKind">Variante (opcional)</Label>
            <Input id="variantKind" name="variantKind" placeholder="Talle / Color" defaultValue={initial.variantKind} />
          </div>
          <div>
            <Label htmlFor="variantValues">Valores (separados por coma)</Label>
            <Input id="variantValues" name="variantValues" placeholder="S, M, L, XL" defaultValue={initial.variantValues} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 font-semibold">Físico y entrega</h2>
        <p className="mb-4 text-sm text-muted">
          El peso valida el tope de 50 kg por pedido del régimen courier: medilo bien.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="weightKg">Peso (kg)</Label>
            <Input id="weightKg" name="weightKg" type="number" step="0.001" min="0.001" defaultValue={initial.weightKg || ""} required />
          </div>
          <div>
            <Label htmlFor="volumeM3">Volumen (m³)</Label>
            <Input id="volumeM3" name="volumeM3" type="number" step="0.0001" min="0" defaultValue={initial.volumeM3 || ""} required />
          </div>
          <div>
            <Label htmlFor="deliveryDaysMin">Entrega desde (días)</Label>
            <Input id="deliveryDaysMin" name="deliveryDaysMin" type="number" min="1" defaultValue={initial.deliveryDaysMin} required />
          </div>
          <div>
            <Label htmlFor="deliveryDaysMax">Entrega hasta (días)</Label>
            <Input id="deliveryDaysMax" name="deliveryDaysMax" type="number" min="1" defaultValue={initial.deliveryDaysMax} required />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 font-semibold">Desglose de costos (solo lo ve el equipo)</h2>
        <p className="mb-4 text-sm text-muted">
          El cliente ve un único precio final. Sugerido = costo + flete + impuestos + margen.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          {numField("Costo (US$)", "costUsd", cost, setCost)}
          {numField("Flete (US$)", "freightUsd", freight, setFreight)}
          {numField("Impuestos (US$)", "taxesUsd", taxes, setTaxes)}
          {numField("Margen (US$)", "marginUsd", margin, setMargin)}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="priceUsd">Precio final (US$)</Label>
            <Input
              id="priceUsd"
              name="priceUsd"
              type="number"
              step="0.01"
              min="0.01"
              value={Number.isFinite(price) && price > 0 ? price : ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="w-40 text-lg font-semibold"
            />
            <FieldHint>Es lo único que ve el cliente.</FieldHint>
          </div>
          <Button type="button" variant="outline" onClick={() => setPrice(suggested)} className="mb-6">
            Usar sugerido: {formatUsd(suggested)}
          </Button>
          <div>
            <Label htmlFor="referencePriceUsd">Precio local de referencia (US$, opcional)</Label>
            <Input
              id="referencePriceUsd"
              name="referencePriceUsd"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial.referencePriceUsd ?? ""}
              className="w-40"
            />
            <FieldHint>Lo que sale comprarlo en Argentina: alimenta el badge de ahorro.</FieldHint>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={initial.active} className="size-4" />
          Activo (visible en el catálogo)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={initial.featured} className="size-4" />
          Destacado en la home
        </label>
      </section>

      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
