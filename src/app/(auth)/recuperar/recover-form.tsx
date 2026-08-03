"use client";

import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function RecoverForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return (
      <p className="rounded-lg bg-success/10 p-4 text-sm text-success">
        Si ese email tiene cuenta, ya te mandamos el link para restablecer la contraseña.
        Revisá tu casilla (en desarrollo: mirá la consola del servidor).
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviarme el link"}
      </Button>
    </form>
  );
}
