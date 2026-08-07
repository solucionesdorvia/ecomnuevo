import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegistrarmePage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { volver } = await searchParams;
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-[-0.03em]">Creá tu cuenta</h1>
      <p className="mb-6 text-sm text-muted">
        La necesitás para comprar: tus pedidos entran al país a tu nombre y los seguís desde acá.
      </p>
      <RegisterForm volver={volver} />
      <p className="mt-4 text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={`/ingresar${volver ? `?volver=${encodeURIComponent(volver)}` : ""}`}
          className="text-primary hover:underline"
        >
          Ingresá
        </Link>
      </p>
    </div>
  );
}
