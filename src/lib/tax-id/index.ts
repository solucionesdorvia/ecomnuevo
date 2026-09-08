import type { TaxIdValidator } from "./types";
import { MockTaxIdValidator } from "./mock";
import { AfipSdkTaxIdValidator } from "./afipsdk";

let validator: TaxIdValidator | undefined;

/**
 * Devuelve el validador del documento del importador según TAX_ID_VALIDATOR:
 *  - "mock" (default): solo formato (DNI/CUIT). Comportamiento actual.
 *  - "afipsdk": padrón real de ARCA vía AFIP SDK (requiere credenciales).
 */
export function getTaxIdValidator(): TaxIdValidator {
  if (!validator) {
    const name = process.env.TAX_ID_VALIDATOR ?? "mock";
    switch (name) {
      case "afipsdk":
        validator = new AfipSdkTaxIdValidator();
        break;
      case "mock":
        validator = new MockTaxIdValidator();
        break;
      default:
        throw new Error(`TAX_ID_VALIDATOR desconocido: "${name}" (soportados: mock, afipsdk)`);
    }
  }
  return validator;
}

export type { TaxIdValidator, TaxIdCheck } from "./types";
