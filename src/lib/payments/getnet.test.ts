import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GetnetProvider,
  getnetDocument,
  interpretIntent,
  resetGetnetTokenCache,
  splitStreet,
  verifyWebhookAuth,
} from "./getnet";
import type { CheckoutInput } from "./types";

const ENV = {
  GETNET_CLIENT_ID: "cid",
  GETNET_CLIENT_SECRET: "csecret",
  GETNET_ENV: "sandbox",
  GETNET_ARS_RATE: "1500",
  GETNET_WEBHOOK_USER: "traelo",
  GETNET_WEBHOOK_PASSWORD: "s3cret",
  NEXT_PUBLIC_APP_URL: "https://www.traelo.ar",
};

const input: CheckoutInput = {
  orderId: "ord_123",
  orderNumber: 42,
  totalUsd: 23.03,
  customerEmail: "ana@example.com",
  successUrl: "/checkout/confirmacion?pedido=ord_123",
  cancelUrl: "/checkout?cancelado=1",
  errorUrl: "/checkout?error=pago",
  customer: {
    name: "Ana María López",
    docType: "CUIT",
    docNumber: "27-35123456-4",
    address: {
      street: "Av. Santa Fe 1860",
      apartment: "5B",
      city: "CABA",
      province: "Ciudad Autónoma de Buenos Aires",
      zipCode: "C1123 AAP",
      phone: "11 4567-8901",
    },
  },
};

type Call = { url: string; init?: RequestInit };
let calls: Call[];

function mockFetch(handler: (url: string, init?: RequestInit) => { status?: number; body: unknown }) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/authentication/oauth2/access_token")) {
        return new Response(JSON.stringify({ access_token: "tok", expires_in: 3599 }), { status: 200 });
      }
      const r = handler(url, init);
      return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
    }),
  );
}

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  resetGetnetTokenCache();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("mapeo de datos", () => {
  it("CUIT de persona humana → DNI del medio; empresa → CUIT entero", () => {
    expect(getnetDocument("CUIT", "27-35123456-4")).toBe("35123456");
    expect(getnetDocument("CUIT", "20-08123456-3")).toBe("8123456");
    expect(getnetDocument("DNI", "35.123.456")).toBe("35123456");
    expect(getnetDocument("CUIT", "30-70308853-4")).toBe("30703088534");
  });

  it("separa calle y altura", () => {
    expect(splitStreet("Av. Santa Fe 1860")).toEqual({ street: "Av. Santa Fe", number: "1860" });
    expect(splitStreet("Calle 7, 1234")).toEqual({ street: "Calle 7", number: "1234" });
    expect(splitStreet("Ruta 3 km 45")).toEqual({ street: "Ruta 3 km", number: "45" });
    expect(splitStreet("Barrio Los Pinos")).toEqual({ street: "Barrio Los Pinos", number: "S/N" });
  });
});

describe("createCheckout", () => {
  it("crea el payment intent en pesos con el monto fijado en el servidor", async () => {
    mockFetch(() => ({
      status: 201,
      body: { payment_intent_id: "pi_1", redirect_url: "https://www.globalgetnet.com/hosted-web-checkout/x" },
    }));
    const r = await new GetnetProvider().createCheckout(input);
    expect(r).toEqual({ externalId: "pi_1", redirectUrl: "https://www.globalgetnet.com/hosted-web-checkout/x" });

    const create = calls.find((c) => c.url.endsWith("/payment-intent"))!;
    expect(create.url).toBe("https://api-sbx.globalgetnet.com/dpy/web-checkout/v1/payment-intent");
    expect((create.init?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const body = JSON.parse(String(create.init?.body));
    // 23,03 USD × 1.500 = 34.545 pesos → 3.454.500 (2 últimos dígitos = centavos)
    expect(body.payment).toEqual({ currency: "ARS", amount: 3454500 });
    expect(body.order_id).toBe("ord_123");
    expect(body.configurations).toEqual({
      success_url: "https://www.traelo.ar/checkout/confirmacion?pedido=ord_123",
      error_url: "https://www.traelo.ar/checkout?error=pago",
    });
    expect(body.customer).toMatchObject({
      first_name: "Ana",
      last_name: "María López",
      document_type: "DNI",
      document_number: "35123456",
      email: "ana@example.com",
      billing_address: { street: "Av. Santa Fe", number: "1860", country: "AR", postal_code: "C1123AAP" },
    });
  });

  it("sin cotización no crea el pago", async () => {
    vi.stubEnv("GETNET_ARS_RATE", "");
    vi.stubEnv("TRANSFER_ARS_RATE", "");
    mockFetch(() => ({ body: {} }));
    await expect(new GetnetProvider().createCheckout(input)).rejects.toThrow(/cotización/);
  });

  it("reusa el token mientras no vence", async () => {
    mockFetch(() => ({ status: 201, body: { payment_intent_id: "pi", redirect_url: "https://x" } }));
    const p = new GetnetProvider();
    await p.createCheckout(input);
    await p.createCheckout(input);
    expect(calls.filter((c) => c.url.endsWith("/access_token"))).toHaveLength(1);
  });
});

describe("estado del pago", () => {
  it("interpreta el payment intent", () => {
    const ok = interpretIntent("pi", {
      status: "paid",
      records: [{ payment: { result: { payment_id: "p1", status: "Authorized" } } }],
    });
    expect(ok.status).toBe("approved");
    expect(interpretIntent("pi", { status: "pending" }).status).toBe("pending");
    expect(
      interpretIntent("pi", {
        status: "pending",
        records: [{ payment: { result: { status: "Denied", return_message: "Fondos insuficientes" } } }],
      }).status,
    ).toBe("pending"); // puede reintentar con otra tarjeta
    const exp = interpretIntent("pi", { status: "expired" });
    expect(exp).toMatchObject({ status: "rejected" });
  });

  it("confirmPayment consulta a Getnet, no confía en el aviso", async () => {
    mockFetch((url) => {
      expect(url).toBe("https://api-sbx.globalgetnet.com/dpy/web-checkout/v1/payment-intent/pi_9");
      return { body: { status: "paid", records: [{ payment: { result: { status: "Authorized" } } }] } };
    });
    expect((await new GetnetProvider().confirmPayment("pi_9")).status).toBe("approved");
  });
});

describe("devolución", () => {
  const intent = (when: string) => ({
    body: {
      status: "paid",
      records: [{ payment: { result: { payment_id: "pay_1", status: "Authorized", transaction_datetime: when } } }],
    },
  });

  it("el mismo día cancela", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-26T18:00:00-03:00"));
    mockFetch((url) =>
      url.endsWith("/cancellation") ? { status: 201, body: { status: "Cancelled" } } : intent("2026-11-26T15:00:00-03:00"),
    );
    await new GetnetProvider().refund("pi_1");
    expect(calls.map((c) => c.url).at(-1)).toBe(
      "https://api-sbx.globalgetnet.com/digital-checkout/v1/payments/pay_1/cancellation",
    );
  });

  it("desde el día siguiente reintegra", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-27T10:00:00-03:00"));
    mockFetch((url) =>
      url.endsWith("/refund") ? { status: 201, body: { status: "Refunded" } } : intent("2026-11-26T15:00:00-03:00"),
    );
    await new GetnetProvider().refund("pi_1");
    expect(calls.some((c) => c.url.endsWith("/cancellation"))).toBe(false);
    expect(calls.map((c) => c.url).at(-1)).toMatch(/\/payments\/pay_1\/refund$/);
  });

  it("si Getnet no acepta, tira error (el pedido no se cancela)", async () => {
    mockFetch((url) =>
      url.endsWith("/refund") ? { status: 422, body: { message: "saldo insuficiente" } } : intent("2026-01-01T10:00:00Z"),
    );
    await expect(new GetnetProvider().refund("pi_1")).rejects.toThrow(/saldo insuficiente/);
  });
});

describe("webhook", () => {
  const basic = (s: string) => `Basic ${Buffer.from(s).toString("base64")}`;
  it("solo acepta el usuario y clave configurados", () => {
    expect(verifyWebhookAuth(basic("traelo:s3cret"))).toBe(true);
    expect(verifyWebhookAuth(basic("traelo:otra"))).toBe(false);
    expect(verifyWebhookAuth(null)).toBe(false);
    expect(verifyWebhookAuth("Bearer abc")).toBe(false);
  });
  it("sin credenciales configuradas rechaza todo", () => {
    vi.stubEnv("GETNET_WEBHOOK_PASSWORD", "");
    expect(verifyWebhookAuth(basic("traelo:"))).toBe(false);
  });
});
