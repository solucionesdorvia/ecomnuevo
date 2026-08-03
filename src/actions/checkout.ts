"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { clearCartCookie, getCart } from "@/lib/cart";
import { validateDocumento } from "@/lib/documento";
import { createOrderFromCart, OrderError } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";

export type CheckoutState = { error?: string };

const newAddressSchema = z.object({
  street: z.string().trim().min(4, "Ingresá calle y número."),
  apartment: z.string().trim().optional(),
  city: z.string().trim().min(2, "Ingresá la localidad."),
  province: z.string().trim().min(2, "Elegí la provincia."),
  zipCode: z.string().trim().min(3, "Ingresá el código postal."),
  phone: z.string().trim().min(6, "Ingresá un teléfono de contacto."),
});

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  if (cart.items.length === 0) redirect("/carrito");

  // Documento: el comprador es el importador — obligatorio y validado
  const doc = validateDocumento(String(formData.get("documento") ?? ""));
  if (!doc.ok) return { error: doc.error };

  // Dirección: una guardada o una nueva
  let addressId = String(formData.get("addressId") ?? "");
  if (addressId === "nueva" || !addressId) {
    const parsed = newAddressSchema.safeParse({
      street: formData.get("street"),
      apartment: formData.get("apartment") || undefined,
      city: formData.get("city"),
      province: formData.get("province"),
      zipCode: formData.get("zipCode"),
      phone: formData.get("phone"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const created = await db.address.create({
      data: { userId: user.id, ...parsed.data, apartment: parsed.data.apartment ?? null },
    });
    addressId = created.id;
  }

  try {
    const order = await createOrderFromCart({
      userId: user.id,
      addressId,
      docType: doc.type,
      docNumber: doc.normalized,
      cart,
    });
    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      totalUsd: order.totalUsd.toNumber(),
      customerEmail: user.email,
      successUrl: `/checkout/confirmacion?pedido=${order.id}`,
      cancelUrl: `/checkout?cancelado=1`,
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentProvider: provider.name, paymentExternalId: checkout.externalId },
    });
    // Guardar el documento como default del usuario para la próxima
    await db.user.update({
      where: { id: user.id },
      data: { docType: doc.type, docNumber: doc.normalized },
    });
    redirect(checkout.redirectUrl);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
}

/** Cierre de compra tras un pago confirmado: vacía el carrito y va al pedido. */
export async function finishPurchase(orderId: string): Promise<void> {
  const user = await requireUser();
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order || order.paymentStatus !== "PAGADO") redirect("/checkout?error=pago");
  await clearCartCookie();
  redirect(`/mis-pedidos/${orderId}?nuevo=1`);
}
