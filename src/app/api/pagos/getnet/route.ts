import { db } from "@/lib/db";
import { confirmOrderPayment } from "@/lib/orders";
import { verifyWebhookAuth } from "@/lib/payments/getnet";

// Aviso de pago de Getnet (Web Checkout). Getnet manda usuario:clave en Basic
// auth (los que se cargan en el Portal). El cuerpo NO se usa para decidir: solo
// identifica el pedido, y el estado real se le pregunta a Getnet dentro de
// confirmOrderPayment. Es idempotente: si el pedido ya está pagado no repite nada.
//
// Respuestas: 200 = recibido (Getnet deja de reintentar); 500 = falla nuestra,
// Getnet reintenta (5 veces y después cada hora hasta 72 h).
export async function POST(req: Request) {
  if (!verifyWebhookAuth(req.headers.get("authorization"))) {
    return new Response("no autorizado", { status: 401 });
  }

  let body: { payment_intent_id?: unknown; order_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("cuerpo inválido", { status: 400 });
  }
  const intentId = typeof body.payment_intent_id === "string" ? body.payment_intent_id : "";
  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  if (!intentId || !orderId) return new Response("faltan datos", { status: 400 });

  const order = await db.order.findFirst({
    where: { id: orderId, paymentProvider: "getnet", paymentExternalId: intentId },
    select: { id: true },
  });
  // Un aviso que no corresponde a ningún pedido nuestro no se reintenta.
  if (!order) {
    console.warn(`[getnet] aviso sin pedido: intent ${intentId}, order ${orderId}`);
    return Response.json({ ok: true });
  }

  try {
    const result = await confirmOrderPayment(order.id);
    return Response.json({ ok: true, paid: result.ok });
  } catch (e) {
    console.error("[getnet] no se pudo procesar el aviso:", e);
    return new Response("error", { status: 500 });
  }
}
