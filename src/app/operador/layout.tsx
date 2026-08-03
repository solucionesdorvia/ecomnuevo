import { requireRole } from "@/lib/auth";

export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  await requireRole("OPERADOR", "ADMIN");
  return (
    <div className="py-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
        Panel de operador
      </p>
      {children}
    </div>
  );
}
