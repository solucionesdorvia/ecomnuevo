import type { Metadata } from "next";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 text-2xl font-semibold">Recuperá tu contraseña</h1>
      <p className="mb-6 text-sm text-muted">
        Te mandamos un link por email para crear una nueva.
      </p>
      <RecoverForm />
    </div>
  );
}
