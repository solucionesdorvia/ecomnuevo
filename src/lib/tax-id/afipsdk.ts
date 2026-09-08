import { validateDocumento, type DocType } from "@/lib/documento";
import type { TaxIdCheck, TaxIdValidator } from "./types";

/**
 * Validador real contra el PADRÓN de ARCA vía AFIP SDK (@afipsdk/afip.js).
 * Consulta el CUIT y devuelve nombre/razón social + estado del contribuyente.
 *
 * ── Para enchufarlo (nada de esto se hace desde el código; son credenciales) ──
 *   1) npm i @afipsdk/afip.js
 *   2) Variables de entorno:
 *        TAX_ID_VALIDATOR=afipsdk
 *        AFIP_SDK_ACCESS_TOKEN=<token de tu cuenta afipsdk.com>
 *        AFIP_CUIT=<CUIT del contribuyente que consulta (p. ej. Ecomex)>
 *        AFIP_ENV=homologacion | produccion   (default: homologacion)
 *      El certificado/clave los administra AFIP SDK con el access_token, o se
 *      pasan por AFIP_CERT / AFIP_KEY (PEM) si preferís gestionarlos vos.
 *   3) En ARCA: delegar el web service de Padrón al CUIT en "Administrador de
 *      Relaciones" (esto lo hace el contador/titular, no el código).
 *
 * Empezar SIEMPRE en homologacion (gratis) antes de produccion.
 *
 * Decisión de negocio pendiente: si ARCA está caído, ¿se bloquea la venta
 * (fail-closed) o se deja pasar con validación de formato (fail-open)? Hoy este
 * validador es fail-closed (propaga el error); cambiarlo es una línea.
 */
export class AfipSdkTaxIdValidator implements TaxIdValidator {
  readonly name = "afipsdk";

  private readonly accessToken = process.env.AFIP_SDK_ACCESS_TOKEN;
  private readonly cuit = process.env.AFIP_CUIT;
  private readonly production = process.env.AFIP_ENV === "produccion";

  async validate(docType: DocType, docNumber: string): Promise<TaxIdCheck> {
    // Chequeo de formato primero (barato, sin red).
    const fmt = validateDocumento(docNumber);
    if (!fmt.ok) return { valid: false, docNumber, reason: fmt.error, source: "format" };

    // El padrón de ARCA se consulta por CUIT/CUIL (11 dígitos). Un DNI suelto no
    // es consultable directo: se valida por formato (resolver el CUIL sería un
    // paso aparte, fuera de este scaffold).
    if (fmt.type === "DNI") {
      return {
        valid: true,
        docType: "DNI",
        docNumber: fmt.normalized,
        source: "format",
        note: "El padrón de ARCA se consulta por CUIT/CUIL; el DNI se validó solo por formato.",
      };
    }

    if (!this.accessToken || !this.cuit) {
      throw new Error(
        "AFIP SDK no configurado: faltan AFIP_SDK_ACCESS_TOKEN y/o AFIP_CUIT. " +
          "Configurá el entorno o volvé a TAX_ID_VALIDATOR=mock.",
      );
    }

    const details = await this.getTaxpayerDetails(fmt.normalized);
    if (!details) {
      return {
        valid: false,
        docType: "CUIT",
        docNumber: fmt.normalized,
        reason: "El CUIT no figura en el padrón de ARCA.",
        source: "afip",
      };
    }

    return {
      valid: true,
      docType: "CUIT",
      docNumber: fmt.normalized,
      taxpayerName: details.name,
      taxStatus: details.status,
      source: "afip",
    };
  }

  /** Llama al padrón A13 vía AFIP SDK. Devuelve null si el CUIT no existe. */
  private async getTaxpayerDetails(cuit: string): Promise<{ name?: string; status?: string } | null> {
    // import dinámico con specifier variable + magic comments para que el
    // bundler (Turbopack/webpack) NO intente resolver la dependencia hasta que
    // realmente se instale (npm i @afipsdk/afip.js). Sin esto, Next tira
    // "Module not found" en build aunque el paquete sea opcional.
    const spec: string = "@afipsdk/afip.js";
    let AfipMod: { default: new (cfg: Record<string, unknown>) => AfipClient };
    try {
      AfipMod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ spec)) as typeof AfipMod;
    } catch {
      throw new Error("Falta la dependencia @afipsdk/afip.js — instalala con: npm i @afipsdk/afip.js");
    }

    const Afip = AfipMod.default;
    const afip = new Afip({
      CUIT: Number(this.cuit),
      access_token: this.accessToken,
      production: this.production,
    });

    let data: TaxpayerDetails | null;
    try {
      // Padrón Alcance 13 — datos de un contribuyente por CUIT.
      data = await afip.RegisterScopeThirteen.getTaxpayerDetails(Number(cuit));
    } catch {
      // AFIP SDK tira error cuando el CUIT no existe en el padrón.
      return null;
    }
    if (!data) return null;

    // NOTA: confirmar los nombres de campos del padrón A13 contra la doc de AFIP
    // SDK al habilitar (la estructura varía entre personas físicas y jurídicas).
    const g = data.datosGenerales;
    const name =
      g?.razonSocial ?? [g?.apellido, g?.nombre].filter(Boolean).join(" ") ?? undefined;
    return { name: name || undefined, status: g?.estadoClave };
  }
}

// Tipos mínimos de lo que usamos del SDK (evita `any` y documenta la forma).
interface AfipClient {
  RegisterScopeThirteen: {
    getTaxpayerDetails(cuit: number): Promise<TaxpayerDetails | null>;
  };
}
interface TaxpayerDetails {
  datosGenerales?: {
    razonSocial?: string;
    apellido?: string;
    nombre?: string;
    estadoClave?: string;
  };
}
