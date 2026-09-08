import { describe, expect, it } from "vitest";
import { MockTaxIdValidator } from "./mock";

const v = new MockTaxIdValidator();

describe("MockTaxIdValidator", () => {
  it("acepta un CUIT válido (solo formato)", async () => {
    const r = await v.validate("CUIT", "20111111112"); // dígito verificador válido
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.docType).toBe("CUIT");
      expect(r.source).toBe("format");
      expect(r.taxpayerName).toBeUndefined(); // el mock no consulta ARCA
    }
  });

  it("acepta un DNI válido", async () => {
    const r = await v.validate("DNI", "30123456");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.docType).toBe("DNI");
  });

  it("rechaza un CUIT con dígito verificador inválido", async () => {
    const r = await v.validate("CUIT", "20111111113");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.source).toBe("format");
      expect(r.reason).toMatch(/dígito verificador/);
    }
  });

  it("rechaza un documento con largo inválido", async () => {
    const r = await v.validate("DNI", "123");
    expect(r.valid).toBe(false);
  });
});
