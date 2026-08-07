import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { volver } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-[-0.03em]">Ingresá a tu cuenta</h1>
      <p className="mb-6 text-sm text-muted">Para ver tus pedidos y comprar más rápido.</p>
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
