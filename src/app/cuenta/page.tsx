import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Heart, Package, ShieldCheck } from "lucide-react";
import { logout } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const user = await requireUser("/cuenta");
  const [orders, favs] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.favorite.count({ where: { userId: user.id } }),
  ]);

  const metodo = [user.googleId && "Google", user.passwordHash && "email y contraseña"].filter(Boolean).join(" · ");

  const LINKS = [
    { href: "/mis-pedidos", label: "Seguí tu carga", meta: `${orders} ${orders === 1 ? "pedido" : "pedidos"}`, icon: Package },
    { href: "/favoritos", label: "Favoritos", meta: `${favs} guardados`, icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-xl py-6">
      <p className="font-mono-ui text-[11px] tracking-[0.08em] text-muted">MI CUENTA</p>
      <h1 className="mb-1 font-display text-3xl font-extrabold tracking-[-0.03em]">Hola, {user.name.split(" ")[0]}</h1>
      <p className="mb-6 text-sm text-muted">{user.email}</p>

      <nav className="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
        {LINKS.map(({ href, label, meta, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 hover:bg-background">
            <Icon className="size-5 text-primary" />
            <span className="flex-1 font-medium">{label}</span>
            <span className="font-mono-ui text-xs text-muted">{meta}</span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        ))}
      </nav>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Tus datos</h2>
        <ProfileForm name={user.name} doc={user.docNumber ?? ""} />
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <ShieldCheck className="size-5 text-success" /> Seguridad
        </h2>
        <p className="text-sm text-muted">Ingresás con {metodo || "email"}.</p>
        <Link href="/recuperar" className="mt-2 inline-block text-sm text-primary hover:underline">
          {user.passwordHash ? "Cambiar contraseña" : "Crear una contraseña"}
        </Link>
      </section>

      <form action={logout}>
        <button className="cursor-pointer text-sm font-medium text-red-600 hover:underline">Cerrar sesión</button>
      </form>
    </div>
  );
}
