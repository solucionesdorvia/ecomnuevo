"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/cuenta";
import type { FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ProfileForm({ name, doc }: { name: string; doc: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nombre y apellido</Label>
        <Input id="name" name="name" defaultValue={name} autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="doc">DNI o CUIT</Label>
        <Input id="doc" name="doc" defaultValue={doc} inputMode="numeric" placeholder="Solo números" />
        <p className="mt-1 text-xs text-muted">
          Tu carga entra al país a tu nombre: lo usamos para completar el checkout más rápido.
        </p>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Guardado.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
