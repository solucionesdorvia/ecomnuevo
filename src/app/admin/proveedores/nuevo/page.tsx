import type { Metadata } from "next";
import { SupplierForm } from "@/components/supplier-form";

export const metadata: Metadata = { title: "Nuevo proveedor — Admin" };

export default function NuevoProveedorPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Nuevo proveedor</h1>
      <SupplierForm />
    </div>
  );
}
