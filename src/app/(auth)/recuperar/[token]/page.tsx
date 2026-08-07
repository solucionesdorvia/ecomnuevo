import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-[-0.03em]">Creá una contraseña nueva</h1>
      <ResetForm token={token} />
    </div>
  );
}
