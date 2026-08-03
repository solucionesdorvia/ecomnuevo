"use client";

import { useActionState } from "react";
import { register, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";

export function RegisterForm({ volver }: { volver?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(register, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {volver && <input type="hidden" name="volver" value={volver} />}
      <div>
        <Label htmlFor="name">Nombre y apellido</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <FieldHint>Mínimo 8 caracteres.</FieldHint>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
