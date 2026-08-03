"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { startCheckout, type CheckoutState } from "@/actions/checkout";
import { validateDocumento } from "@/lib/documento";
import { PROVINCIAS } from "@/lib/provincias";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select } from "@/components/ui/input";

type SavedAddress = {
  id: string;
  street: string;
  apartment: string | null;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
};

export function CheckoutForm({
  addresses,
  defaultDoc,
}: {
  addresses: SavedAddress[];
  defaultDoc: string;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [addressId, setAddressId] = useState<string>(addresses[0]?.id ?? "nueva");
  const [doc, setDoc] = useState(defaultDoc);

  const docCheck = doc.trim() ? validateDocumento(doc) : null;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Documento */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 font-semibold">Tu documento</h2>
        <p className="mb-3 text-sm text-muted">
          Tu compra ingresa al país a tu nombre (régimen courier): necesitamos tu DNI o CUIT
          para el despacho en Aduana.
        </p>
        <Label htmlFor="documento">DNI o CUIT</Label>
        <div className="relative">
          <Input
            id="documento"
            name="documento"
            inputMode="numeric"
            placeholder="Ej.: 32456789 o 27-32456789-3"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            required
            aria-invalid={docCheck ? !docCheck.ok : undefined}
            className={docCheck && !docCheck.ok ? "border-red-400" : ""}
          />
          {docCheck && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {docCheck.ok ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : (
                <XCircle className="size-5 text-red-500" />
              )}
            </span>
          )}
        </div>
        {docCheck &&
          (docCheck.ok ? (
            <FieldHint>{docCheck.type} válido.</FieldHint>
          ) : (
            <FieldError>{docCheck.error}</FieldError>
          ))}
      </section>

      {/* Dirección */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Dirección de entrega</h2>

        {addresses.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${addressId === a.id ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="addressId"
                  value={a.id}
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-0.5"
                />
                <span>
                  {a.street}
                  {a.apartment ? `, ${a.apartment}` : ""} — {a.city}, {a.province} ({a.zipCode})
                  <span className="block text-xs text-muted">Tel: {a.phone}</span>
                </span>
              </label>
            ))}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${addressId === "nueva" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <input
                type="radio"
                name="addressId"
                value="nueva"
                checked={addressId === "nueva"}
                onChange={() => setAddressId("nueva")}
              />
              Usar una dirección nueva
            </label>
          </div>
        )}

        {(addresses.length === 0 || addressId === "nueva") && (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.length === 0 && <input type="hidden" name="addressId" value="nueva" />}
            <div className="sm:col-span-2">
              <Label htmlFor="street">Calle y número</Label>
              <Input id="street" name="street" required placeholder="Av. Rivadavia 4521" autoComplete="address-line1" />
            </div>
            <div>
              <Label htmlFor="apartment">Piso / depto (opcional)</Label>
              <Input id="apartment" name="apartment" placeholder="3º B" autoComplete="address-line2" />
            </div>
            <div>
              <Label htmlFor="city">Localidad</Label>
              <Input id="city" name="city" required autoComplete="address-level2" />
            </div>
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select id="province" name="province" required defaultValue="">
                <option value="" disabled>
                  Elegí…
                </option>
                {PROVINCIAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="zipCode">Código postal</Label>
              <Input id="zipCode" name="zipCode" required placeholder="C1424" autoComplete="postal-code" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="11 5555-1234" autoComplete="tel" />
            </div>
          </div>
        )}
      </section>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={pending || (docCheck ? !docCheck.ok : false)}
      >
        {pending ? "Preparando el pago…" : "Ir a pagar"}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <Lock className="size-3.5" /> Pago procesado de forma segura. No guardamos los datos de tu
        tarjeta.
      </p>
    </form>
  );
}
