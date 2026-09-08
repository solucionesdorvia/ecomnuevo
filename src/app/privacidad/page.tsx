import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos personales recopila Traelo, para qué los usamos, con quién los compartimos y cómo ejercés tus derechos bajo la Ley 25.326 de Protección de Datos Personales.",
};

const SECTIONS = [
  {
    h: "1. Quién trata tus datos",
    p: [
      "Traelo es operado por Ecomex. Somos responsables del tratamiento de los datos personales que nos das al crear una cuenta y al comprar. Tratamos tus datos conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.",
    ],
  },
  {
    h: "2. Qué datos recopilamos",
    p: ["Recopilamos únicamente los datos necesarios para procesar tu compra y entregártela:"],
    list: [
      "Datos de contacto: nombre y correo electrónico.",
      "Datos de entrega: domicilio, localidad, provincia, código postal y teléfono.",
      "Datos de importación: DNI o CUIT, requeridos porque el comprador figura como importador.",
      "Datos de tus pedidos: qué compraste, montos y estado logístico.",
      "Datos técnicos mínimos: una cookie de sesión para mantenerte identificado mientras usás el sitio.",
    ],
  },
  {
    h: "3. Para qué los usamos",
    p: ["Usamos tus datos exclusivamente para:"],
    list: [
      "Procesar y despachar tu compra, y gestionar la importación a tu nombre.",
      "Mantenerte informado del estado de tu pedido.",
      "Cumplir obligaciones legales, aduaneras e impositivas.",
      "Dar soporte y responder tus consultas.",
    ],
  },
  {
    h: "4. Datos de pago",
    p: [
      "No almacenamos los datos de tu tarjeta. El pago se procesa a través de un proveedor de pagos externo, que recibe los datos de la tarjeta directamente y de forma cifrada. Nosotros solo conservamos el resultado de la operación (aprobado, rechazado, reembolsado).",
    ],
  },
  {
    h: "5. Con quién los compartimos",
    p: [
      "Compartimos los datos mínimos indispensables con terceros que intervienen en tu compra: el proveedor de pagos, los operadores logísticos y de despacho aduanero, y las autoridades cuando la ley lo exige. No vendemos ni cedemos tus datos con fines publicitarios.",
    ],
  },
  {
    h: "6. Cuánto tiempo los conservamos",
    p: [
      "Conservamos tus datos mientras tu cuenta esté activa y durante el plazo que exijan las obligaciones legales e impositivas asociadas a tus compras. Luego los eliminamos o anonimizamos.",
    ],
  },
  {
    h: "7. Tus derechos",
    p: [
      "Podés acceder a tus datos, rectificarlos, actualizarlos o solicitar su supresión, en los términos de la Ley 25.326. La Agencia de Acceso a la Información Pública es el órgano de control y tiene la atribución de atender denuncias por incumplimiento de las normas sobre protección de datos personales.",
    ],
  },
  {
    h: "8. Cambios en esta política",
    p: [
      "Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa. La versión vigente es siempre la publicada acá, con su fecha de última actualización.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <div className="pb-16">
      <div className="fullbleed bg-primary text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
          <p className="eyebrow text-celeste">Legales</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Política de privacidad
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
            {s.list && (
              <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-muted">
                {s.list.map((li) => (
                  <li key={li} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
          Al comprar aceptás también nuestros{" "}
          <Link href="/terminos" className="text-accent hover:underline">
            términos y condiciones
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
