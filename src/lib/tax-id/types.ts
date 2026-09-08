// Capa abstracta de validación del documento del importador. El resto del código
// solo conoce esta interfaz; pasar de la validación de formato (mock) al padrón
// real de ARCA (afipsdk) es agregar una implementación y cambiar TAX_ID_VALIDATOR
// en el entorno — mismo patrón que PaymentProvider y Mailer.
//
// Contexto de negocio: el comprador es el importador. La RG 5884/2026 exige
// transmitir el CUIL/CUIT/CDI del destinatario en la declaración anticipada; un
// documento inválido traba el envío en aduana. Validarlo en el checkout evita
// pedidos que después no despachan. Ver memoria traelo-regimen-puerta-a-puerta.

import type { DocType } from "@/lib/documento";

export type TaxIdCheck =
  | {
      valid: true;
      docType: DocType;
      docNumber: string;
      /** Nombre/razón social que ARCA asocia al CUIT (solo con el validador afip). */
      taxpayerName?: string;
      /** Estado del contribuyente en ARCA (ej. "ACTIVO"), si el padrón lo devuelve. */
      taxStatus?: string;
      /** De dónde salió la validación: "format" = solo dígito verificador; "afip" = padrón. */
      source: "format" | "afip";
      /** Aclaración cuando no se pudo verificar contra el padrón (ej. DNI sin CUIL). */
      note?: string;
    }
  | {
      valid: false;
      docType?: DocType;
      docNumber: string;
      reason: string;
      source: "format" | "afip";
    };

export interface TaxIdValidator {
  readonly name: string;
  /**
   * Valida el documento del importador.
   * - mock: solo formato (DNI 7-8 dígitos / CUIT 11 con dígito verificador).
   * - afipsdk: además consulta el padrón de ARCA por el CUIT y devuelve el nombre.
   * `docNumber` viene ya normalizado (solo dígitos).
   */
  validate(docType: DocType, docNumber: string): Promise<TaxIdCheck>;
}
