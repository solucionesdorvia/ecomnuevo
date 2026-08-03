import { describe, expect, it } from "vitest";
import { formatDocumento, isValidCuit, validateDocumento } from "./documento";

describe("validateDocumento", () => {
  it("acepta DNI de 7 dígitos", () => {
    expect(validateDocumento("9123456")).toEqual({ ok: true, type: "DNI", normalized: "9123456" });
  });

  it("acepta DNI de 8 dígitos", () => {
    expect(validateDocumento("32456789")).toEqual({ ok: true, type: "DNI", normalized: "32456789" });
  });

  it("acepta DNI con puntos y espacios", () => {
    expect(validateDocumento("32.456.789")).toEqual({ ok: true, type: "DNI", normalized: "32456789" });
    expect(validateDocumento(" 32 456 789 ")).toEqual({ ok: true, type: "DNI", normalized: "32456789" });
  });

  it("acepta CUIT válido con y sin guiones", () => {
    // 20-32456789-6 → verificador correcto
    const digits = "20324567896";
    expect(isValidCuit(digits)).toBe(true);
    expect(validateDocumento("20-32456789-6")).toEqual({ ok: true, type: "CUIT", normalized: digits });
    expect(validateDocumento(digits)).toEqual({ ok: true, type: "CUIT", normalized: digits });
  });

  it("rechaza CUIT con dígito verificador inválido", () => {
    const res = validateDocumento("20-32456789-5");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/verificador/);
  });

  it("rechaza longitudes inválidas", () => {
    for (const bad of ["123456", "123456789", "1234567890", "123456789012"]) {
      expect(validateDocumento(bad).ok).toBe(false);
    }
  });

  it("rechaza letras y vacío", () => {
    expect(validateDocumento("32a56789").ok).toBe(false);
    expect(validateDocumento("").ok).toBe(false);
    expect(validateDocumento("--..").ok).toBe(false);
  });

  it("CUIT reales conocidos validan", () => {
    // CUITs públicos: AFIP 33-69345023-9, Mercado Libre 30-70308853-4
    expect(isValidCuit("33693450239")).toBe(true);
    expect(isValidCuit("30703088534")).toBe(true);
  });
});

describe("formatDocumento", () => {
  it("formatea CUIT con guiones", () => {
    expect(formatDocumento("CUIT", "20324567896")).toBe("20-32456789-6");
  });

  it("formatea DNI con separador de miles", () => {
    expect(formatDocumento("DNI", "32456789")).toBe("32.456.789");
  });
});
