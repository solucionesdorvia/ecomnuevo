import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { User, Address, Product, Supplier } from "@prisma/client";
import { db } from "./db";
import type { Cart } from "./cart";
import {
  advanceOrderState,
  confirmOrderPayment,
  createOrderFromCart,
  discardUnpaidTransfer,
  OrderError,
} from "./orders";
import { getPaymentProvider } from "./payments";
import { MockProvider } from "./payments/mock";
import { resetGetnetTokenCache } from "./payments/getnet";
import { checkCourierLimits } from "./courier";

// Corre contra la DB de test (ver script "test" en package.json).
// Guarda de seguridad: jamás contra la DB de desarrollo.
if (!process.env.DATABASE_URL?.includes("superplataforma_test")) {
  throw new Error("Los tests de integración requieren DATABASE_URL apuntando a superplataforma_test");
}

let user: User;
let otherUser: User;
let operator: User;
let admin: User;
let address: Address;
let supplier: Supplier;
let product: Product;

function cartWith(quantity: number, p: Product = product): Cart {
  const priceUsd = p.priceUsd.toNumber();
  const weightKg = p.weightKg.toNumber();
  const totalUsd = priceUsd * quantity;
  const totalWeightKg = weightKg * quantity;
  const volumeM3 = p.volumeM3.toNumber();
  const totalVolumeM3 = volumeM3 * quantity;
  return {
    items: [
      {
        product: {
          id: p.id,
          slug: p.slug,
          title: p.title,
          images: p.images,
          priceUsd,
          weightKg,
          volumeM3,
          active: p.active,
          deliveryDaysMin: p.deliveryDaysMin,
          deliveryDaysMax: p.deliveryDaysMax,
        },
        variant: null,
        quantity,
        lineTotalUsd: totalUsd,
        lineWeightKg: totalWeightKg,
        lineVolumeM3: totalVolumeM3,
      },
    ],
    totalUsd,
    totalWeightKg,
    totalVolumeM3,
    courier: checkCourierLimits(totalUsd, totalWeightKg, [], totalVolumeM3),
    count: quantity,
  };
}

/** Crea un pedido y lo deja PAGADO vía el flujo real (mock provider). */
async function paidOrder(quantity = 1) {
  const order = await createOrderFromCart({
    userId: user.id,
    addressId: address.id,
    docType: "DNI",
    docNumber: "32456789",
    cart: cartWith(quantity),
  });
  const checkout = await getPaymentProvider().createCheckout({
    orderId: order.id,
    orderNumber: order.number,
    totalUsd: order.totalUsd.toNumber(),
    customerEmail: user.email,
    successUrl: "/x",
    cancelUrl: "/y",
  });
  await db.order.update({
    where: { id: order.id },
    data: { paymentProvider: "mock", paymentExternalId: checkout.externalId },
  });
  await MockProvider.resolve(checkout.externalId, true);
  const result = await confirmOrderPayment(order.id);
  expect(result.ok).toBe(true);
  return db.order.findUniqueOrThrow({ where: { id: order.id } });
}

beforeAll(async () => {
  process.env.PAYMENT_PROVIDER = "mock";
  await db.statusEvent.deleteMany();
  await db.shipment.deleteMany();
  await db.procurementOrder.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.mockPayment.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.supplier.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();

  user = await db.user.create({
    data: { email: "test@cliente.demo", name: "Test Cliente", passwordHash: "x:y", role: "CLIENTE" },
  });
  otherUser = await db.user.create({
    data: { email: "otro@cliente.demo", name: "Otro Cliente", passwordHash: "x:y", role: "CLIENTE" },
  });
  operator = await db.user.create({
    data: { email: "operador@test.demo", name: "Operador Test", passwordHash: "x:y", role: "OPERADOR" },
  });
  admin = await db.user.create({
    data: { email: "admin@test.demo", name: "Admin Test", passwordHash: "x:y", role: "ADMIN" },
  });
  address = await db.address.create({
    data: { userId: user.id, street: "Calle 1", city: "CABA", province: "CABA", zipCode: "C1000", phone: "11" },
  });
  supplier = await db.supplier.create({
    data: { name: "Proveedor Test", country: "China", depot: "Depósito Test" },
  });
  product = await db.product.create({
    data: {
      slug: "producto-test",
      title: "Producto Test",
      description: "d",
      category: "HOGAR",
      images: ["https://example.com/1.jpg"],
      supplierId: supplier.id,
      weightKg: 10,
      volumeM3: 0.01,
      costUsd: 50,
      freightUsd: 20,
      taxesUsd: 20,
      marginUsd: 10,
      priceUsd: 100,
    },
  });
});

beforeEach(async () => {
  await db.statusEvent.deleteMany();
  await db.shipment.deleteMany();
  await db.procurementOrder.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.mockPayment.deleteMany();
});

describe("createOrderFromCart", () => {
  it("crea el pedido con totales, peso y precios congelados", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "32456789",
      cart: cartWith(2),
    });
    expect(order.totalUsd.toNumber()).toBe(200);
    expect(order.totalWeightKg.toNumber()).toBe(20);
    expect(order.paymentStatus).toBe("PENDIENTE");
    const items = await db.orderItem.findMany({ where: { orderId: order.id } });
    expect(items).toHaveLength(1);
    expect(items[0].unitPriceUsd.toNumber()).toBe(100);
    expect(items[0].quantity).toBe(2);
  });

  it("rechaza un carrito que supera USD 3.000 (revalidación en servidor)", async () => {
    // 31 × US$100 = 3100 > 3000 — aunque el carrito diga courier.ok, se re-chequea
    const cart = cartWith(31);
    cart.courier.ok = true; // cliente malicioso
    await expect(
      createOrderFromCart({ userId: user.id, addressId: address.id, docType: "DNI", docNumber: "1", cart }),
    ).rejects.toThrow(/supera el tope/);
  });

  it("rechaza un carrito que supera 1 m³ (revalidación en servidor)", async () => {
    const bulky = await db.product.update({ where: { id: product.id }, data: { volumeM3: 0.4 } });
    try {
      const cart = cartWith(3, bulky); // 3 × 0,4 = 1,2 m³ (30 kg, US$ 300: dentro de los otros topes)
      cart.courier.ok = true; // cliente malicioso
      await expect(
        createOrderFromCart({ userId: user.id, addressId: address.id, docType: "DNI", docNumber: "1", cart }),
      ).rejects.toThrow(/1 m³/);
    } finally {
      await db.product.update({ where: { id: product.id }, data: { volumeM3: 0.01 } });
    }
  });

  it("rechaza un carrito que supera 50 kg", async () => {
    await expect(
      createOrderFromCart({
        userId: user.id,
        addressId: address.id,
        docType: "DNI",
        docNumber: "1",
        cart: cartWith(6), // 60 kg
      }),
    ).rejects.toThrow(/50 kg/);
  });

  it("rechaza una dirección que no es del usuario", async () => {
    await expect(
      createOrderFromCart({
        userId: otherUser.id,
        addressId: address.id, // dirección de `user`
        docType: "DNI",
        docNumber: "1",
        cart: cartWith(1),
      }),
    ).rejects.toThrow(/dirección/);
  });

  it("rechaza carrito vacío", async () => {
    const empty: Cart = {
      items: [],
      totalUsd: 0,
      totalWeightKg: 0,
      totalVolumeM3: 0,
      courier: checkCourierLimits(0, 0),
      count: 0,
    };
    await expect(
      createOrderFromCart({ userId: user.id, addressId: address.id, docType: "DNI", docNumber: "1", cart: empty }),
    ).rejects.toThrow(/vacío/);
  });
});

describe("confirmOrderPayment", () => {
  it("pago aprobado: PAGADO + evento + shipment + compra a proveedor", async () => {
    const order = await paidOrder();
    expect(order.paymentStatus).toBe("PAGADO");
    expect(order.state).toBe("PAGADO");

    const events = await db.statusEvent.findMany({ where: { orderId: order.id } });
    expect(events).toHaveLength(1);
    expect(events[0].toState).toBe("PAGADO");
    expect(events[0].actorId).toBeNull(); // lo registró el sistema

    expect(await db.shipment.findUnique({ where: { orderId: order.id } })).not.toBeNull();

    const pos = await db.procurementOrder.findMany({ where: { orderId: order.id } });
    expect(pos).toHaveLength(1);
    expect(pos[0].supplierId).toBe(supplier.id);
    expect(pos[0].status).toBe("PENDIENTE");
  });

  it("es idempotente: confirmar dos veces no duplica nada", async () => {
    const order = await paidOrder();
    const again = await confirmOrderPayment(order.id);
    expect(again.ok).toBe(true);
    expect(await db.statusEvent.count({ where: { orderId: order.id } })).toBe(1);
    expect(await db.procurementOrder.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("pago rechazado: FALLIDO y sin efectos colaterales", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "32456789",
      cart: cartWith(1),
    });
    const checkout = await getPaymentProvider().createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      totalUsd: 100,
      customerEmail: user.email,
      successUrl: "/x",
      cancelUrl: "/y",
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentProvider: "mock", paymentExternalId: checkout.externalId },
    });
    await MockProvider.resolve(checkout.externalId, false);

    const result = await confirmOrderPayment(order.id);
    expect(result.ok).toBe(false);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("FALLIDO");
    expect(await db.statusEvent.count({ where: { orderId: order.id } })).toBe(0);
    expect(await db.procurementOrder.count({ where: { orderId: order.id } })).toBe(0);
  });

  it("un pedido reembolsado no se reprocesa: sigue REEMBOLSADO", async () => {
    const order = await paidOrder();
    await advanceOrderState({ orderId: order.id, toState: "CANCELADO", actorId: operator.id, note: "Sin stock" });

    const result = await confirmOrderPayment(order.id);
    expect(result.ok).toBe(false);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("REEMBOLSADO");
    expect(after.state).toBe("CANCELADO");
  });

  it("un reembolso no se revierte aunque el procesador siga informando el pago", async () => {
    const order = await paidOrder();
    await advanceOrderState({ orderId: order.id, toState: "CANCELADO", actorId: operator.id, note: "Sin stock" });
    // El cobro original sigue figurando aprobado en el procesador.
    await MockProvider.resolve(order.paymentExternalId!, true);

    const result = await confirmOrderPayment(order.id);
    expect(result.ok).toBe(false);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("REEMBOLSADO");
    expect(await db.procurementOrder.count({ where: { orderId: order.id } })).toBe(1);
    expect(await db.statusEvent.count({ where: { orderId: order.id, toState: "PAGADO" } })).toBe(1);
  });

  it("un pago rechazado que después se aprueba todavía se confirma", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "32456789",
      cart: cartWith(1),
    });
    const checkout = await getPaymentProvider().createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      totalUsd: 100,
      customerEmail: user.email,
      successUrl: "/x",
      cancelUrl: "/y",
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentProvider: "mock", paymentExternalId: checkout.externalId },
    });
    expect((await confirmOrderPayment(order.id)).ok).toBe(false);
    await MockProvider.resolve(checkout.externalId, true);

    expect((await confirmOrderPayment(order.id)).ok).toBe(true);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("PAGADO");
  });

  it("confirmaciones simultáneas (aviso + vuelta del cliente) no duplican nada", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "32456789",
      cart: cartWith(1),
    });
    const checkout = await getPaymentProvider().createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      totalUsd: 100,
      customerEmail: user.email,
      successUrl: "/x",
      cancelUrl: "/y",
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentProvider: "mock", paymentExternalId: checkout.externalId },
    });
    await MockProvider.resolve(checkout.externalId, true);

    const results = await Promise.all([confirmOrderPayment(order.id), confirmOrderPayment(order.id)]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await db.statusEvent.count({ where: { orderId: order.id } })).toBe(1);
    expect(await db.procurementOrder.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("Getnet todavía sin resolver: queda PENDIENTE, no FALLIDO", async () => {
    vi.stubEnv("GETNET_CLIENT_ID", "cid");
    vi.stubEnv("GETNET_CLIENT_SECRET", "cs");
    vi.stubEnv("GETNET_ENV", "sandbox");
    resetGetnetTokenCache();
    let intentStatus = "pending";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/access_token")
          ? new Response(JSON.stringify({ access_token: "t", expires_in: 3599 }))
          : new Response(
              JSON.stringify({
                status: intentStatus,
                records:
                  intentStatus === "paid" ? [{ payment: { result: { payment_id: "p", status: "Authorized" } } }] : [],
              }),
            ),
      ),
    );
    try {
      const order = await createOrderFromCart({
        userId: user.id,
        addressId: address.id,
        docType: "DNI",
        docNumber: "32456789",
        cart: cartWith(1),
      });
      await db.order.update({
        where: { id: order.id },
        data: { paymentProvider: "getnet", paymentExternalId: "pi_test" },
      });

      const pending = await confirmOrderPayment(order.id);
      expect(pending).toMatchObject({ ok: false, pending: true });
      expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PENDIENTE");

      intentStatus = "paid";
      expect((await confirmOrderPayment(order.id)).ok).toBe(true);
      expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PAGADO");
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it("pedido sin pago iniciado no se confirma", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "1",
      cart: cartWith(1),
    });
    const result = await confirmOrderPayment(order.id);
    expect(result.ok).toBe(false);
  });
});

describe("advanceOrderState", () => {
  it("avanza un paso, registra evento con actor y fecha del shipment", async () => {
    const order = await paidOrder();
    await advanceOrderState({
      orderId: order.id,
      toState: "COMPRADO_EN_ORIGEN",
      actorId: user.id,
      note: "OC enviada",
    });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.state).toBe("COMPRADO_EN_ORIGEN");

    const event = await db.statusEvent.findFirst({
      where: { orderId: order.id, toState: "COMPRADO_EN_ORIGEN" },
    });
    expect(event?.fromState).toBe("PAGADO");
    expect(event?.actorId).toBe(user.id);
    expect(event?.note).toBe("OC enviada");

    const shipment = await db.shipment.findUniqueOrThrow({ where: { orderId: order.id } });
    expect(shipment.boughtAt).not.toBeNull();
    expect(shipment.shippedAt).toBeNull();
  });

  it("rechaza transiciones inválidas (saltear pasos / retroceder)", async () => {
    const order = await paidOrder();
    await expect(
      advanceOrderState({ orderId: order.id, toState: "EMBARCADO", actorId: user.id }),
    ).rejects.toThrow(OrderError);
    await expect(
      advanceOrderState({ orderId: order.id, toState: "ENTREGADO", actorId: user.id }),
    ).rejects.toThrow(/Transición inválida/);
  });

  it("cancelar exige motivo", async () => {
    const order = await paidOrder();
    await expect(
      advanceOrderState({ orderId: order.id, toState: "CANCELADO", actorId: user.id, note: "  " }),
    ).rejects.toThrow(/motivo es obligatorio/);
  });

  it("cancelar reembolsa el pago en el procesador y marca REEMBOLSADO", async () => {
    const order = await paidOrder();
    await advanceOrderState({
      orderId: order.id,
      toState: "CANCELADO",
      actorId: user.id,
      note: "Proveedor sin stock",
    });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.state).toBe("CANCELADO");
    expect(after.paymentStatus).toBe("REEMBOLSADO");
    expect(after.cancelReason).toBe("Proveedor sin stock");

    const mock = await db.mockPayment.findUniqueOrThrow({
      where: { externalId: after.paymentExternalId! },
    });
    expect(mock.status).toBe("refunded");
  });

  it("después de EMBARCADO no se puede cancelar", async () => {
    const order = await paidOrder();
    await advanceOrderState({ orderId: order.id, toState: "COMPRADO_EN_ORIGEN", actorId: user.id });
    await advanceOrderState({ orderId: order.id, toState: "RECIBIDO_DEPOSITO_EXTERIOR", actorId: user.id });
    await advanceOrderState({ orderId: order.id, toState: "EMBARCADO", actorId: user.id });
    await expect(
      advanceOrderState({ orderId: order.id, toState: "CANCELADO", actorId: user.id, note: "tarde" }),
    ).rejects.toThrow(/Transición inválida/);
  });

  it("no se opera un pedido sin pago confirmado", async () => {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId: address.id,
      docType: "DNI",
      docNumber: "1",
      cart: cartWith(1),
    });
    await expect(
      advanceOrderState({ orderId: order.id, toState: "COMPRADO_EN_ORIGEN", actorId: user.id }),
    ).rejects.toThrow(/pago confirmado/);
  });

  it("el flujo feliz completo llega a ENTREGADO con todas las fechas", async () => {
    const order = await paidOrder();
    for (const s of ["COMPRADO_EN_ORIGEN", "RECIBIDO_DEPOSITO_EXTERIOR", "EMBARCADO", "EN_ADUANA", "ENTREGADO"] as const) {
      await advanceOrderState({ orderId: order.id, toState: s, actorId: user.id });
    }
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.state).toBe("ENTREGADO");
    const shipment = await db.shipment.findUniqueOrThrow({ where: { orderId: order.id } });
    for (const f of ["boughtAt", "atDepotAt", "shippedAt", "atCustomsAt", "deliveredAt"] as const) {
      expect(shipment[f]).not.toBeNull();
    }
    // 1 evento de pago + 5 avances
    expect(await db.statusEvent.count({ where: { orderId: order.id } })).toBe(6);
  });
});

/** Pedido por transferencia, todavía sin confirmar (como lo deja el checkout). */
async function transferOrder() {
  const order = await createOrderFromCart({
    userId: user.id,
    addressId: address.id,
    docType: "DNI",
    docNumber: "32456789",
    cart: cartWith(1),
  });
  return db.order.update({
    where: { id: order.id },
    data: { paymentProvider: "transferencia", paymentExternalId: `transfer_${order.id}` },
  });
}

/** La transferencia no se pagó: sigue PENDIENTE y sin ningún efecto del pago. */
async function expectTransferUntouched(orderId: string) {
  const after = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  expect(after.paymentStatus).toBe("PENDIENTE");
  expect(await db.statusEvent.count({ where: { orderId } })).toBe(0);
  expect(await db.shipment.count({ where: { orderId } })).toBe(0);
  expect(await db.procurementOrder.count({ where: { orderId } })).toBe(0);
}

describe("transferencia", () => {
  it("confirmar a mano deja el pago a nombre del operador", async () => {
    const order = await transferOrder();
    const result = await confirmOrderPayment(order.id, operator.id);
    expect(result.ok).toBe(true);
    const ev = await db.statusEvent.findFirstOrThrow({ where: { orderId: order.id } });
    expect(ev.toState).toBe("PAGADO");
    expect(ev.actorId).toBe(operator.id);
  });

  it("un ADMIN también la confirma", async () => {
    const order = await transferOrder();
    expect((await confirmOrderPayment(order.id, admin.id)).ok).toBe(true);
  });

  it("sin actor no se confirma: abrir /checkout/confirmacion no la paga", async () => {
    const order = await transferOrder();
    const result = await confirmOrderPayment(order.id);
    expect(result.ok).toBe(false);
    await expectTransferUntouched(order.id);
  });

  it("un cliente no la confirma, ni siendo el dueño del pedido", async () => {
    const order = await transferOrder();
    expect((await confirmOrderPayment(order.id, user.id)).ok).toBe(false);
    expect((await confirmOrderPayment(order.id, otherUser.id)).ok).toBe(false);
    await expectTransferUntouched(order.id);
  });

  it("un actor inexistente no la confirma", async () => {
    const order = await transferOrder();
    expect((await confirmOrderPayment(order.id, "no-existe")).ok).toBe(false);
    await expectTransferUntouched(order.id);
  });

  it("vale también si la transferencia viene del proveedor por defecto", async () => {
    const order = await transferOrder();
    await db.order.update({ where: { id: order.id }, data: { paymentProvider: null } });
    process.env.PAYMENT_PROVIDER = "transferencia";
    try {
      expect((await confirmOrderPayment(order.id)).ok).toBe(false);
    } finally {
      process.env.PAYMENT_PROVIDER = "mock";
    }
    await expectTransferUntouched(order.id);
  });

  it("cancelar una transferencia cobrada no pasa por la pasarela y anota la devolución manual", async () => {
    const order = await transferOrder();
    await confirmOrderPayment(order.id, operator.id);
    await advanceOrderState({ orderId: order.id, toState: "CANCELADO", actorId: user.id, note: "Sin stock" });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.state).toBe("CANCELADO");
    expect(after.paymentStatus).toBe("PAGADO"); // la plata vuelve a mano, no la devolvió un procesador
    expect(after.cancelReason).toMatch(/^Sin stock — la transferencia se devuelve a mano/);
  });

  it("descartar una transferencia que nunca llegó: FALLIDO + CANCELADO con motivo", async () => {
    const order = await transferOrder();
    await discardUnpaidTransfer({ orderId: order.id, actorId: otherUser.id, reason: "72 h sin comprobante" });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("FALLIDO");
    expect(after.state).toBe("CANCELADO");
    expect(after.cancelReason).toBe("72 h sin comprobante");
  });

  it("una transferencia descartada no se confirma después, ni con un operador", async () => {
    const order = await transferOrder();
    await discardUnpaidTransfer({ orderId: order.id, actorId: operator.id, reason: "72 h sin comprobante" });

    const result = await confirmOrderPayment(order.id, operator.id);
    expect(result.ok).toBe(false);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.paymentStatus).toBe("FALLIDO");
    expect(after.state).toBe("CANCELADO");
    expect(await db.statusEvent.count({ where: { orderId: order.id, toState: "PAGADO" } })).toBe(0);
    expect(await db.procurementOrder.count({ where: { orderId: order.id } })).toBe(0);
  });

  it("no se descarta sin motivo ni un pedido ya pagado", async () => {
    const order = await transferOrder();
    await expect(
      discardUnpaidTransfer({ orderId: order.id, actorId: otherUser.id, reason: " " }),
    ).rejects.toThrow(OrderError);
    await confirmOrderPayment(order.id, operator.id);
    await expect(
      discardUnpaidTransfer({ orderId: order.id, actorId: otherUser.id, reason: "x" }),
    ).rejects.toThrow(/pendientes de pago/);
  });
});
