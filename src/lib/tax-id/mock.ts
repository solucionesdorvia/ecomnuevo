import { validateDocumento, type DocType } from "@/lib/documento";
import type { TaxIdCheck, TaxIdValidator } from "./types";

/**
 * Validador por defecto (dev/prod hasta enchufar AFIP SDK): valida solo el
 * FORMATO — DNI 7-8 dígitos o CUIT 11 con dígito verificador. No consulta ARCA.
 * Es el comportamiento actual del checkout, ahora detrás de la interfaz.
 */
export class MockTaxIdValidator implements TaxIdValidator {
  readonly name = "mock";

  async validate(docType: DocType, docNumber: string): Promise<TaxIdCheck> {
    const r = validateDocumento(docNumber);
    if (!r.ok) {
      return { valid: false, docNumber, reason: r.error, source: "format" };
    }
    return { valid: true, docType: r.type, docNumber: r.normalized, source: "format" };
  }
}
