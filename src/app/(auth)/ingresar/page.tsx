import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoogleButton } from "@/components/google-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { volver, error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-[-0.03em]">Ingresá a tu cuenta</h1>
      <p className="mb-6 text-sm text-muted">Para ver tus pedidos y comprar más rápido.</p>
      {error === "google" && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          No pudimos ingresar con Google. Probá de nuevo o usá tu email.
        </p>
      )}
      <GoogleButton volver={volver} />
      <LoginForm volver={volver} />
      <p className="mt-4 text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link
          href={`/registrarme${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`}
          className="text-primary hover:underline"
        >
          Registrate
        </Link>
      </p>
      <p className="mt-1 text-sm text-muted">
        <Link href="/recuperar" className="text-primary hover:underline">
          Me olvidé la contraseña
        </Link>
      </p>
    </div>
  );
}
