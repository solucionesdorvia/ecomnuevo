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

## Identidad visual — marca "Traelo" (sistema de diseño v1 de Andy, 7/8/2026)
Nombre de la marca de cara al cliente: **Traelo** (siempre en minúscula, con el
punto naranja: `traelo.`). Tagline: **"Lo viste en la fábrica. Traelo."** Ecomex es
la empresa/cliente; Traelo es el marketplace. El diseño de referencia (board de
Claude Design) está en `scripts/` no — se portó a los componentes; el HTML original
quedó archivado. Isologo = ruta punteada Shanghái→tu puerta (único motion del sistema).

**Paleta** (tokens en `src/app/globals.css` — no tocar sin hablarlo)
- Fondo `#F4F6F2` (sal — cálido y fresco, no blanco puro)
- Superficies/cards `#FFFFFF` (para que las fotos de producto exploten en contraste)
- Tinta oceánica `#0C2136` · Texto secundario `#5E7183`
- **Primario** `#0C2136` (tinta oceánica) — navegación, chips activos, botones
  secundarios. La estructura seria, "el mar".
- **Acento** `#FF5A1F` (naranja contenedor) — reservado casi exclusivamente para
  precio final, badges de ahorro, el botón principal de compra y el punto de la
  marca. Usado en todos lados pierde el significado.
- Celeste `#8FCDEB` / `#BFE2F2` — apoyo suave (info de envío, decorativo).
- Éxito `#1FA97A` · Borde sutil `#E2E7E5`

**Tipografía (sistema v1):** tres familias vía `next/font/google` —
**Bricolage Grotesque** (700/800) para display, títulos y precios; **Archivo**
(400–700) para texto de interfaz, descripciones y microcopy; **Space Mono** (400/700)
para datos duros: SKU, kg, códigos, estados, eyebrows. Tokens `--font-display`,
`--font-sans`, `--font-mono` en globals. (Antes: Outfit única.)

**Moneda:** **USD** en toda la interfaz (`formatUsd`). El board de Andy estaba
diseñado en pesos + MercadoPago, pero se decidió (7/8/2026) mantener USD/Stripe como
está construido; se reproduce el *look* del diseño, no su moneda. Si algún día se pasa
a pesos + MercadoPago es cambio de backend (checkout, validaciones, tests).

**Estética general:** grilla de producto limpia, mucho aire, jerarquía clara entre
precio-final / producto / CTA.

## Alcance de Fase 1 (construido — ver README.md para setup y credenciales demo)
1. **Catálogo curado**: productos cargados por el equipo desde `/admin` (desglose
   de costos, peso/volumen, proveedor, variantes). Búsqueda, filtros, ficha.
2. **Marketplace público**: carrito sin login, con topes courier visibles.
3. **Checkout real con tarjeta en dólares**, con captura y validación de
   **DNI (7-8 dígitos) o CUIT (11, con dígito verificador)** — el comprador es
   el importador — y **validación dura de 50 kg / USD 3.000 por pedido**
   (en UI y re-validado en servidor). Pagos detrás de la interfaz
   `PaymentProvider` (mock en dev, Stripe test; Mercado Pago u otro se enchufa
   sin tocar el resto).
4. **Panel de operador** (`/operador`): cola de pedidos pagados, avance manual
   de estados (solo transiciones válidas del enum, cancelación con motivo),
   historial auditable (`StatusEvent`).
5. **"Mis pedidos"** para el cliente con timeline de estados, y **email al
   cliente en cada cambio de estado** (capa `Mailer`; consola en dev).
6. **Admin** (`/admin`): dashboard mínimo + CRUD de productos y proveedores con
   cálculo asistido del precio final.

Estados: PAGADO → COMPRADO_EN_ORIGEN → RECIBIDO_DEPOSITO_EXTERIOR → EMBARCADO →
EN_ADUANA → ENTREGADO (+ CANCELADO antes de EMBARCADO, con motivo).

**Criterio de éxito:** un pedido real, pagado en dólares, visible en el panel,
comprado afuera y despachado. Nada más que eso.

## Stack (el implementado)
Next.js 16 (App Router) + TypeScript + Tailwind v4 + PostgreSQL + Prisma 6.
Auth propia con sesiones en DB (scrypt + cookie httpOnly), roles CLIENTE /
OPERADOR / ADMIN. Pagos: interfaz `PaymentProvider` (mock | stripe). Emails:
interfaz `Mailer` (console en dev). DB local: docker `superplataforma-pg`,
puerto 54340. Comandos y credenciales demo: README.md.

## Cómo trabajar
- Alcance de fase, no de producto entero — si algo no está en "Alcance de Fase 1",
  se pregunta antes de construirlo, no se asume.
- Antes de construir una pantalla, mostrame el boceto o describime la interacción.
- Mostrar cada bloque antes de seguir con el siguiente (catálogo → marketplace →
  checkout → panel de operador).
- Ante la duda entre construir de más o de menos: de menos.
