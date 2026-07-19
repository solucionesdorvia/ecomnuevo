@AGENTS.md

# Superplataforma — Marketplace de compra directa al exterior (Fase 1: MVP)

## Qué es esto
Marketplace de compra directa a proveedores del exterior — experiencia tipo Shein/Temu:
el usuario busca, compra en dólares con tarjeta, y recibe en su casa, más barato que
comprando local. La logística viaja consolidada por vía marítima bajo régimen courier
argentino (hasta 50kg / USD 3.000 por envío). El equipo de operaciones compra afuera y
gestiona la logística puertas adentro; el usuario solo compra.

**Cliente:** Andy y su socio (dueño de la idea). Yo (Valentín) desarrollo el producto.
**Este prompt cubre la Fase 1 completa, tal como está cotizada y enviada** (Propuesta-
Plataforma-Ecomex-v2, US$7.000–12.000, 8–10 semanas). No construir nada de las fases
2-4 descritas más abajo, aunque parezca fácil o "ya que estamos".

## La interfaz es el producto — leer esto antes de tocar código
En un marketplace de commodities (todos venden lo mismo, importado), lo único que no
se puede copiar es la experiencia. Acá se compite contra Shein/Temu con menos catálogo
y menos presupuesto de marketing — la interfaz tiene que hacer el trabajo de convencer
a alguien de comprarle a una marca que nunca escuchó, pagando en dólares, sin saber
si el paquete va a llegar. Eso no se resuelve con un tema de shadcn por default.

**Principios, en orden de prioridad:**

1. **Mobile-first de verdad, no responsive de después.** La inmensa mayoría de esta
   audiencia compra desde el celular, muchas veces con conexión mala. Diseñá primero
   para una pantalla de 375px y una 4G lenta. Presupuesto de performance: LCP < 2.5s
   en 4G, sin layout shift al cargar imágenes (reservar el espacio siempre).

2. **Precio final, sin sorpresas, en todos lados.** El dolor #1 de comprar afuera es
   el costo oculto que aparece en la aduana. Cada precio que se muestra —grilla, ficha,
   carrito— es el precio final (producto + flete + impuestos), comunicado
   explícitamente ("precio final, nada más que pagar").

3. **Cero fricción hasta pagar.** Sin login para comprar. Carrito visible siempre
   (sticky). Checkout en un solo paso si se puede, dos como máximo. Cada campo de más
   es gente que se va. Los datos de compra (email, dirección) se piden lo más tarde
   posible, no al entrar al sitio.

4. **Confianza visible, no declarada.** Nadie le compra en dólares a una marca que
   nunca vio. Tiempos de entrega estimados y realistas (no "3-5 días" si en verdad
   son semanas por barco), fotos de producto reales y consistentes, un "cómo
   funciona" de 3 pasos visible antes de pedir la tarjeta.

5. **Rápido de navegar, no cargado de estímulos.** No copiar los patrones de
   Shein/Temu (countdowns falsos, ruedas de descuento, notificaciones inventadas de
   "alguien compró esto"). Con catálogo curado y chico, esa estética grita "no hay
   nada acá". La sensación a perseguir es más cercana a una tienda DTC prolija que a
   un centro comercial chino.

6. **Micro-interacciones que dan feedback, no que decoran.** Agregar al carrito,
   aplicar un filtro, cambiar de variante — respuesta visual inmediata, nunca un
   salto de página. Loading states con skeletons, nunca pantallas en blanco.

Si dudás entre una feature nueva o pulir uno de estos seis puntos, pulí esto primero.

## Identidad visual
**Paleta**
- Fondo `#FAF7F2` (crema cálido, no blanco puro)
- Superficies/cards `#FFFFFF` (para que las fotos de producto exploten en contraste)
- Tinta `#14171F` · Texto secundario `#5B6472`
- **Primario** `#2541B2` (azul cobalto) — navegación, botones secundarios, links.
  Es plata en dólares yéndose al exterior: el color comunica seriedad, no urgencia.
- **Acento** `#FF6B45` (coral cálido) — reservado casi exclusivamente para precio
  final, badges de ahorro y el botón principal de compra. Usado en todos lados pierde
  el significado.
- Éxito `#1FA97A` · Borde sutil `#E8E3DA`

**Tipografía:** una sola familia variable de alto rendimiento (Inter o Geist) para
todo — títulos, cuerpo, precios. Nada de 2-3 fuentes: acá la velocidad de carga
importa más que la personalidad tipográfica, y los precios tienen que verse
impecables en tabular figures.

**Estética general:** grilla de producto limpia, mucho aire, jerarquía clara entre
precio-final / producto / CTA.

## Alcance de Fase 1 (lo único que hay que construir)
1. **Catálogo curado**: productos reales de proveedores reales del exterior, cargados
   por el equipo (no scraping, no conexión en vivo a plataformas externas todavía).
   Cada producto con precio final ya calculado (producto + flete + impuestos).
2. **Marketplace público**: búsqueda, filtros, ficha de producto, carrito. Sin login
   de comprador si se puede evitar.
3. **Checkout real en tarjeta de crédito, en dólares** (Stripe u otro procesador con
   soporte de cuenta internacional — confirmar cuál antes de integrar). El pago es
   real: entra plata de verdad a una cuenta de la plataforma.
4. **Panel de operador** (con login): lista de pedidos pagados. El equipo marca
   manualmente el estado de cada uno a medida que compra afuera y liquida al
   proveedor correspondiente. Sin automatización de compra ni de pago a proveedores
   todavía — eso es fase 2/3.

**Criterio de éxito:** un pedido real, pagado en dólares, visible en el panel,
comprado afuera y despachado. Nada más que eso.

## Supuestos confirmados por el dueño (19/7/2026) — no inventar sobre esto
- Quiere la experiencia de compra directa desde el día uno (no "catálogo propio"
  como destino final — es un paso intermedio hacia eso).
- Pago: tarjeta de crédito, en dólares. La cuenta de la plataforma recibe el total y
  el equipo liquida a cada proveedor (a mano en fase 1).
- No existe ningún sistema de casillas, stock ni tracking hoy — el depósito fiscal y
  los depósitos en el exterior operan como consolidador mayorista (B2B), no aplican
  a este servicio. Todo lo que se construye acá es nuevo.
- No hay stock propio: el modelo es comprar contra pedido a fábrica/proveedor (esto
  es fase 2, pero no diseñar fase 1 asumiendo gestión de inventario).
- Orden de prioridad del dueño: 1) marketplace, 2) compras/consolidación, 3) tracking
  — por eso fase 1 es 100% marketplace + checkout, nada de tracking todavía.

## Fuera de scope — NO construir en esta fase
- Scraping o integración en vivo con plataformas externas (Fase 4, a cotizar aparte).
- Compra automática a proveedores (Fase 4).
- Sistema de inventario/stock en depósitos (no aplica — no hay stock propio).
- Compras a fábrica + consolidación de envíos automatizada (Fase 2).
- Tracking para el comprador — estados de envío, notificaciones (Fase 3).
- Reparto automático de pagos a múltiples proveedores / Stripe Connect (Fase 3) — en
  fase 1 el pago entra a una cuenta única y se liquida a mano.
- Login de comprador, salvo que sea imprescindible para el checkout.
- Cualquier feature "porque ya que estamos" que no esté en la lista de arriba.

## Stack sugerido
Next.js + Supabase (Postgres, Auth para el panel de operador, Storage para imágenes
de producto). Pagos: Stripe (confirmar soporte de cuenta internacional antes de
integrar — es dinero real, no simulado). Deploy: Vercel o Railway.

## Cómo trabajar
- Alcance de fase, no de producto entero — si algo no está en "Alcance de Fase 1",
  se pregunta antes de construirlo, no se asume.
- Antes de construir una pantalla, mostrame el boceto o describime la interacción.
- Mostrar cada bloque antes de seguir con el siguiente (catálogo → marketplace →
  checkout → panel de operador).
- Ante la duda entre construir de más o de menos: de menos.
