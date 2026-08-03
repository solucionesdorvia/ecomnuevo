"use client";

import { useActionState } from "react";
import { resetPassword, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <FieldHint>Mínimo 8 caracteres. Se cierran todas tus sesiones abiertas.</FieldHint>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
