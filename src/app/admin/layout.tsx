import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  return (
    <div className="py-6">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Administración</p>
        <nav className="flex gap-1 text-sm">
          <Link href="/admin" className="rounded-full px-3 py-1 text-muted hover:bg-foreground/5 hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/admin/productos" className="rounded-full px-3 py-1 text-muted hover:bg-foreground/5 hover:text-foreground">
            Productos
          </Link>
          <Link href="/admin/proveedores" className="rounded-full px-3 py-1 text-muted hover:bg-foreground/5 hover:text-foreground">
            Proveedores
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
