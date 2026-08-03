"use client";

import { useActionState } from "react";
import { saveSupplier, type AdminFormState } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export type SupplierFormData = {
  id?: string;
  name: string;
  country: string;
  depot: string;
  contactUrl: string;
  notes: string;
  active: boolean;
};

export function SupplierForm({ supplier }: { supplier?: SupplierFormData }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveSupplier, {});
  const initial = supplier ?? { name: "", country: "", depot: "", contactUrl: "", notes: "", active: true };

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="country">País</Label>
          <Input id="country" name="country" placeholder="China" defaultValue={initial.country} required />
        </div>
        <div>
          <Label htmlFor="depot">Depósito de salida</Label>
          <Input id="depot" name="depot" placeholder="Depósito Shenzhen" defaultValue={initial.depot} required />
        </div>
      </div>
      <div>
        <Label htmlFor="contactUrl">Link del proveedor (opcional)</Label>
        <Input id="contactUrl" name="contactUrl" type="url" placeholder="https://…" defaultValue={initial.contactUrl} />
      </div>
      <div>
        <Label htmlFor="notes">Notas internas (opcional)</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial.active} className="size-4" />
        Activo (se le pueden asignar productos)
      </label>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Crear proveedor"}
      </Button>
    </form>
  );
}
