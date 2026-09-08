import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Cómo funciona la compra en Traelo: precio final, régimen courier, el comprador como importador, tiempos de entrega, cancelaciones y pagos en dólares.",
};

const SECTIONS = [
  {
    h: "1. Qué es Traelo",
    p: [
      "Traelo es un marketplace operado por Ecomex que te permite comprar productos directamente a fábricas y depósitos del exterior y recibirlos en tu domicilio en Argentina. Nosotros compramos el producto en origen por tu cuenta y gestionamos la logística hasta tu puerta.",
      "Al usar el sitio y realizar una compra, aceptás estos términos. Si no estás de acuerdo con alguno, no completes la compra.",
    ],
  },
  {
    h: "2. Precio final, sin costos ocultos",
    p: [
      "El precio que ves en el catálogo, la ficha del producto y el carrito es el precio final en dólares estadounidenses (USD): incluye el producto, el flete marítimo y los impuestos de importación aplicables. No hay costos adicionales al recibir el pedido.",
      "El pago se realiza con tarjeta, en dólares, al momento de la compra. Hasta que no se acredita el pago, la compra no queda confirmada.",
    ],
  },
  {
    h: "3. Régimen courier y límites por pedido",
    p: [
      "Las compras se importan bajo el régimen courier (envíos puerta a puerta). Por ese régimen, cada pedido tiene un tope de 50 kg de peso y US$ 3.000 de valor, por destinatario. Estos límites se validan automáticamente en el carrito y se vuelven a verificar antes de confirmar el pago.",
      "Si tu compra supera alguno de esos topes, vas a necesitar dividirla en más de un pedido.",
    ],
  },
  {
    h: "4. El comprador es el importador",
    p: [
      "Por el régimen courier, quien compra figura como importador ante la aduana. Por eso te pedimos tu DNI (7 u 8 dígitos) o CUIT (11 dígitos) al momento del checkout. Es tu responsabilidad que esos datos sean correctos y que estés habilitado para importar bajo este régimen.",
      "Ecomex gestiona la compra en origen, el despacho y la logística en tu nombre, pero no asume tu condición de importador ni obligaciones fiscales que recaigan sobre vos.",
    ],
  },
  {
    h: "5. Tiempos de entrega",
    p: [
      "Tu carga viaja consolidada por vía marítima. El tiempo estimado de entrega es de aproximadamente 45 a 60 días desde la confirmación del pago, y puede variar según la disponibilidad del producto en fábrica, los tiempos de despacho aduanero y la logística de última milla.",
      "Los plazos son estimados de buena fe, no garantías contractuales de fecha exacta. Podés seguir el estado de tu pedido en todo momento desde tu cuenta.",
    ],
  },
  {
    h: "6. Cancelaciones y reembolsos",
    p: [
      "Podés solicitar la cancelación de un pedido mientras no haya sido embarcado. Una vez que la carga zarpa, la compra ya está en tránsito y no puede cancelarse.",
      "Si cancelamos nosotros un pedido antes del embarque (por falta de stock en origen u otro motivo), te reintegramos el importe pagado por el mismo medio de pago.",
    ],
  },
  {
    h: "7. Productos y disponibilidad",
    p: [
      "Las fotos, descripciones y stock reflejan la información que nos provee cada fábrica o proveedor. Hacemos lo posible por mantenerla actualizada, pero puede haber diferencias o faltantes. Si un producto no está disponible tras tu compra, te lo informamos y te ofrecemos el reintegro.",
    ],
  },
  {
    h: "8. Cambios en estos términos",
    p: [
      "Podemos actualizar estos términos para reflejar cambios en el servicio o en la normativa aplicable. La versión vigente es siempre la publicada en esta página, con su fecha de última actualización.",
    ],
  },
];

export default function TerminosPage() {
  return (
    <div className="pb-16">
      <div className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
          <p className="eyebrow text-celeste">Legales</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Términos y condiciones
          </h1>
          <p className="mt-4 font-mono-ui text-xs text-celeste">Última actualización: agosto de 2026</p>
        </div>
      </div>

      <article className="mx-auto mt-10 max-w-3xl">
        {SECTIONS.map((s) => (
          <section key={s.h} className="mb-9">
            <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-primary lg:text-2xl">
              {s.h}
            </h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-3 text-[15px] leading-relaxed text-muted">
                {para}
              </p>
            ))}
          </section>
        ))}

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
          ¿Dudas sobre una compra? Revisá{" "}
          <Link href="/privacidad" className="text-accent hover:underline">
            cómo tratamos tus datos
          </Link>{" "}
          o seguí el estado de tu pedido desde{" "}
          <Link href="/mis-pedidos" className="text-accent hover:underline">
            tu cuenta
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
