// Configuración de cobro por transferencia bancaria. Los datos reales
// (titular, CBU/alias, cotización, WhatsApp) viven en el entorno: se cambian
// sin tocar código y no quedan hardcodeados en el repo. Si no están cargados,
// la página de transferencia lo avisa en vez de mostrar datos vacíos.

export type TransferAccount = {
  moneda: "ARS" | "USD";
  titular: string;
  banco: string;
  cbu: string;
  alias: string;
};

export type TransferConfig = {
  /** Pesos por dólar, para mostrar el monto en ARS. 0 = sin cotización cargada. */
  arsRate: number;
  /** Número para enviar el comprobante (formato internacional sin +, ej. 5491155551234). */
  whatsapp: string;
  cuentas: TransferAccount[];
};

export function getTransferConfig(): TransferConfig {
  const titular = process.env.TRANSFER_TITULAR ?? "";
  const cuentas: TransferAccount[] = [];
  if (process.env.TRANSFER_ARS_CBU || process.env.TRANSFER_ARS_ALIAS) {
    cuentas.push({
      moneda: "ARS",
      titular,
      banco: process.env.TRANSFER_ARS_BANCO ?? "",
      cbu: process.env.TRANSFER_ARS_CBU ?? "",
      alias: process.env.TRANSFER_ARS_ALIAS ?? "",
    });
  }
  if (process.env.TRANSFER_USD_CBU || process.env.TRANSFER_USD_ALIAS) {
    cuentas.push({
      moneda: "USD",
      titular,
      banco: process.env.TRANSFER_USD_BANCO ?? "",
      cbu: process.env.TRANSFER_USD_CBU ?? "",
      alias: process.env.TRANSFER_USD_ALIAS ?? "",
    });
  }
  return {
    arsRate: Number(process.env.TRANSFER_ARS_RATE ?? "0") || 0,
    whatsapp: process.env.TRANSFER_WHATSAPP ?? "",
    cuentas,
  };
}

/** Monto en pesos a transferir (redondeado), o null si no hay cotización cargada. */
export function arsAmount(totalUsd: number, rate: number): number | null {
  if (!rate || rate <= 0) return null;
  return Math.round(totalUsd * rate);
}
