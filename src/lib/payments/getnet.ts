import { timingSafeEqual } from "node:crypto";
import { arsAmount } from "@/lib/transfer";
import type {
  CheckoutCustomer,
  CheckoutInput,
  CheckoutSession,
  PaymentConfirmation,
  PaymentProvider,
} from "./types";

// Tarjeta de crédito/débito vía Getnet (Santander) · Web Checkout, Argentina.
// Cobra en PESOS: el total del pedido (USD) se convierte con la cotización
// cargada en el entorno, y el monto queda fijado del lado del servidor al crear
// el payment intent (nadie lo puede cambiar desde el navegador).
//
// Flujo: createCheckout crea el payment intent y manda al cliente a la página de
// pago de Getnet (redirect). Getnet avisa por webhook (/api/pagos/getnet) y el
// cliente vuelve a /checkout/confirmacion. En los dos casos el estado se
// pregunta a Getnet con GET /payment-intent/{id}: ni el webhook ni el redirect
// alcanzan solos para dar un pedido por pagado.
//
// Entorno:
//   PAYMENT_PROVIDER=getnet
//   GETNET_CLIENT_ID / GETNET_CLIENT_SECRET   (Portal de Getnet → Productos Digitales → Integraciones)
//   GETNET_ENV=sandbox | pre | produccion     (default: sandbox)
//   GETNET_WEBHOOK_USER / GETNET_WEBHOOK_PASSWORD  (los mismos que se cargan en el Portal)
//   GETNET_ARS_RATE   pesos por dólar (si falta, usa TRANSFER_ARS_RATE)
//   GETNET_API_BASE   opcional: pisa la URL base del Web Checkout API

// Ruta verificada en producción el 26-nov-2026 (la de /digital-checkout/v1
// para payment intents devuelve 403 de política).
const HOSTS = {
  sandbox: { api: "https://api-sbx.globalgetnet.com", checkout: "/dpy/web-checkout/v1" },
  pre: { api: "https://api.pre.globalgetnet.com", checkout: "/dpy/web-checkout/v1" },
  produccion: { api: "https://api.globalgetnet.com", checkout: "/dpy/web-checkout/v1" },
} as const;

type Env = keyof typeof HOSTS;

function env(): Env {
  const e = process.env.GETNET_ENV ?? "sandbox";
  if (e in HOSTS) return e as Env;
  throw new Error(`GETNET_ENV desconocido: "${e}" (soportados: sandbox, pre, produccion)`);
}

/** Base del Web Checkout API (payment intents). */
function checkoutBase(): string {
  if (process.env.GETNET_API_BASE) return process.env.GETNET_API_BASE.replace(/\/$/, "");
  const h = HOSTS[env()];
  return `${h.api}${h.checkout}`;
}

function apiHost(): string {
  return process.env.GETNET_API_BASE ? new URL(process.env.GETNET_API_BASE).origin : HOSTS[env()].api;
}

/** Pesos por dólar con los que se cobra la tarjeta. 0 = sin cotización. */
export function getnetArsRate(): number {
  return Number(process.env.GETNET_ARS_RATE ?? process.env.TRANSFER_ARS_RATE ?? "0") || 0;
}

/** Total en pesos (enteros) que se le cobra al cliente, o null sin cotización. */
export function getnetArsTotal(totalUsd: number): number | null {
  return arsAmount(totalUsd, getnetArsRate());
}

// ─── Mapeo de datos del comprador ────────────────────────────────────────────

/**
 * Getnet Argentina identifica al comprador por DNI. Para un CUIT de persona
 * humana (20/23/24/27) el DNI son los 8 dígitos del medio; un CUIT de empresa
 * se manda entero (CONFIRMAR con Getnet si lo aceptan así).
 */
export function getnetDocument(docType: "DNI" | "CUIT", docNumber: string): string {
  const digits = docNumber.replace(/\D/g, "");
  if (docType === "CUIT" && digits.length === 11 && /^(20|23|24|27)/.test(digits)) {
    return String(Number(digits.slice(2, 10)));
  }
  return digits;
}

/** "Av. Santa Fe 1860" → { street: "Av. Santa Fe", number: "1860" }. Sin altura: "S/N". */
export function splitStreet(street: string): { street: string; number: string } {
  const s = street.trim().replace(/\s+/g, " ");
  const m = s.match(/^(.*\D)\s+(\d+[A-Za-z]?)$/);
  if (m) return { street: m[1].replace(/[,\s]+$/, ""), number: m[2] };
  return { street: s, number: "S/N" };
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "Cliente", last: parts[0] ?? "Traelo" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function customerPayload(c: CheckoutCustomer, email: string) {
  const { first, last } = splitName(c.name);
  const doc = getnetDocument(c.docType, c.docNumber);
  const { street, number } = splitStreet(c.address.street);
  const address = {
    street,
    number,
    ...(c.address.apartment ? { complement: c.address.apartment } : {}),
    city: c.address.city,
    state: c.address.province,
    country: "AR",
    postal_code: c.address.zipCode.replace(/\s/g, ""),
  };
  const phone = c.address.phone.replace(/\D/g, "");
  return {
    customer: {
      customer_id: doc,
      first_name: first,
      last_name: last,
      name: `${first} ${last}`.trim(),
      email,
      document_type: "DNI",
      document_number: doc,
      ...(phone ? { phone_number: phone } : {}),
      billing_address: address,
    },
    shipping: {
      first_name: first,
      last_name: last,
      name: `${first} ${last}`.trim(),
      ...(phone ? { phone_number: phone } : {}),
      address,
    },
  };
}

// ─── Respuesta del GET /payment-intent ───────────────────────────────────────

type PaymentResult = {
  payment_id?: string;
  status?: string;
  return_message?: string;
  transaction_datetime?: string;
};

export type GetnetIntent = {
  status?: string; // pending | paid | cancelled | expired …
  payment_intent_id?: string;
  order_id?: string;
  payment?: { amount?: number; currency?: string };
  records?: { payment?: { amount?: number; currency?: string; result?: PaymentResult } }[];
};

/** El intento de cobro autorizado del intent, si lo hubo. */
export function authorizedResult(intent: GetnetIntent): PaymentResult | undefined {
  return intent.records?.map((r) => r.payment?.result).find((r) => r?.status?.toLowerCase() === "authorized");
}

/** Traduce el estado del intent al de la capa de pagos. */
export function interpretIntent(externalId: string, intent: GetnetIntent): PaymentConfirmation {
  const status = (intent.status ?? "").toLowerCase();
  if (authorizedResult(intent) || status === "paid") return { status: "approved", externalId };
  if (status === "pending" || status === "") {
    return { status: "pending", externalId, reason: "Getnet todavía no confirmó el pago." };
  }
  const last = intent.records?.at(-1)?.payment?.result;
  return {
    status: "rejected",
    externalId,
    reason: last?.return_message ?? `Pago ${status} en Getnet.`,
  };
}

/** Fecha calendario en Argentina (para decidir cancelación D+0 vs. reintegro D+1). */
function arDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(d);
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

/** Valida el header Authorization (Basic) que Getnet manda con cada aviso. */
export function verifyWebhookAuth(header: string | null): boolean {
  const user = process.env.GETNET_WEBHOOK_USER;
  const pass = process.env.GETNET_WEBHOOK_PASSWORD;
  if (!user || !pass || !header) return false;
  const m = header.match(/^Basic\s+(.+)$/i);
  if (!m) return false;
  const got = Buffer.from(m[1].trim());
  const want = Buffer.from(Buffer.from(`${user}:${pass}`).toString("base64"));
  return got.length === want.length && timingSafeEqual(got, want);
}

// ─── Proveedor ───────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

/** Solo para tests. */
export function resetGetnetTokenCache() {
  tokenCache = null;
}

export class GetnetProvider implements PaymentProvider {
  readonly name = "getnet";

  private credentials() {
    const id = process.env.GETNET_CLIENT_ID;
    const secret = process.env.GETNET_CLIENT_SECRET;
    if (!id || !secret) {
      throw new Error(
        "Faltan GETNET_CLIENT_ID / GETNET_CLIENT_SECRET — generalas en el Portal de Getnet " +
          "(Productos Digitales → Integraciones), o usá PAYMENT_PROVIDER=mock mientras tanto.",
      );
    }
    return { id, secret };
  }

  /** Token OAuth (dura 60 min): se reusa hasta 1 minuto antes de vencer. */
  private async token(): Promise<string> {
    if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
    const { id, secret } = this.credentials();
    const res = await fetch(`${apiHost()}/authentication/oauth2/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
    });
    if (!res.ok) throw new Error(`Getnet rechazó las credenciales (HTTP ${res.status}).`);
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error("Getnet no devolvió access_token.");
    tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3599) * 1000 };
    return data.access_token;
  }

  private async call<T>(url: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${await this.token()}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, body: body as T };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    if (!input.customer) throw new Error("Getnet necesita los datos del comprador (nombre, DNI y domicilio).");
    const pesos = getnetArsTotal(input.totalUsd);
    if (!pesos) throw new Error("Falta la cotización en pesos (GETNET_ARS_RATE) para cobrar con Getnet.");
    const amount = pesos * 100; // entero: los 2 últimos dígitos son centavos

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const abs = (u: string) => (u.startsWith("/") ? `${base}${u}` : u);
    const title = `Traelo pedido ${input.orderNumber}`;

    const { status, body } = await this.call<{ payment_intent_id?: string; redirect_url?: string; message?: string }>(
      `${checkoutBase()}/payment-intent`,
      {
        method: "POST",
        body: JSON.stringify({
          mode: "instant",
          order_id: input.orderId,
          configurations: {
            success_url: abs(input.successUrl),
            error_url: abs(input.errorUrl ?? input.cancelUrl),
          },
          payment: { currency: "ARS", amount },
          product: [{ product_type: "physical_goods", title, description: title, value: amount, quantity: 1 }],
          ...customerPayload(input.customer, input.customerEmail),
          pickup_store: false,
          soft_descriptor: "TRAELO",
          expires_at: "2h",
        }),
      },
    );
    if (status >= 300 || !body?.payment_intent_id || !body.redirect_url) {
      throw new Error(`Getnet no creó el pago (HTTP ${status}${body?.message ? `: ${body.message}` : ""}).`);
    }
    return { redirectUrl: body.redirect_url, externalId: body.payment_intent_id };
  }

  async getIntent(intentId: string): Promise<GetnetIntent> {
    const { status, body } = await this.call<GetnetIntent>(
      `${checkoutBase()}/payment-intent/${encodeURIComponent(intentId)}`,
    );
    if (status !== 200 || !body) throw new Error(`No se pudo consultar el pago en Getnet (HTTP ${status}).`);
    return body;
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmation> {
    return interpretIntent(externalId, await this.getIntent(externalId));
  }

  /**
   * Devuelve el pago completo. Mismo día (hora argentina) = cancelación;
   * desde el día siguiente = reintegro. Si la cancelación no corre (p. ej.
   * pasado el corte de las 23 h), se intenta el reintegro.
   */
  async refund(externalId: string): Promise<void> {
    const intent = await this.getIntent(externalId);
    const paid = authorizedResult(intent);
    if (!paid?.payment_id) throw new Error("Getnet no tiene un cobro autorizado para este pedido.");
    const url = `${apiHost()}/digital-checkout/v1/payments/${encodeURIComponent(paid.payment_id)}`;

    const sameDay = paid.transaction_datetime && arDay(new Date(paid.transaction_datetime)) === arDay(new Date());
    if (sameDay) {
      const c = await this.call<{ status?: string }>(`${url}/cancellation`, { method: "POST" });
      if (c.status < 300 && c.body?.status?.toLowerCase() === "cancelled") return;
    }
    const r = await this.call<{ status?: string; message?: string }>(`${url}/refund`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (r.status >= 300 || r.body?.status?.toLowerCase() !== "refunded") {
      // 403 = la cuenta no tiene habilitadas las devoluciones por API (lo
      // habilita Getnet). El pedido no se cancela hasta que la devolución pase.
      const hint = r.status === 403 ? " La cuenta no tiene habilitadas las devoluciones por API: pedíselas a Getnet o devolvé desde su Portal." : "";
      throw new Error(
        `Getnet no aceptó la devolución (HTTP ${r.status}${r.body?.message ? `: ${r.body.message}` : ""}).${hint}`,
      );
    }
  }
}
