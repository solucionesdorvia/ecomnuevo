// Validación de DNI y CUIT. El comprador es el importador legal bajo el
// régimen courier: sin documento válido no hay pedido.

export type DocType = "DNI" | "CUIT";

export type DocValidation =
  | { ok: true; type: DocType; normalized: string }
  | { ok: false; error: string };

/** DNI: 7-8 dígitos. CUIT: 11 dígitos con dígito verificador válido. */
export function validateDocumento(raw: string): DocValidation {
  const digits = raw.replace(/[.\-\s]/g, "");
  if (!/^\d+$/.test(digits)) {
    return { ok: false, error: "Ingresá solo números (sin letras)." };
  }
  if (digits.length === 7 || digits.length === 8) {
    return { ok: true, type: "DNI", normalized: digits };
  }
  if (digits.length === 11) {
    if (!isValidCuit(digits)) {
      return { ok: false, error: "El CUIT no es válido (falla el dígito verificador)." };
    }
    return { ok: true, type: "CUIT", normalized: digits };
  }
  return {
    ok: false,
    error: "Tiene que ser un DNI (7-8 dígitos) o un CUIT (11 dígitos).",
  };
}

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function isValidCuit(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false;
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const mod = sum % 11;
  const check = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
  return check === Number(digits[10]);
}

export function formatDocumento(type: DocType, digits: string): string {
  if (type === "CUIT" && digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  }
  return new Intl.NumberFormat("es-AR").format(Number(digits));
}
