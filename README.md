# Ecomex Market

Marketplace de compra directa a proveedores del exterior para Argentina.
El usuario compra en dólares con tarjeta y recibe en su casa; el precio que ve
es **final** (producto + flete marítimo + impuestos). Detrás, un equipo de
operadores compra cada pedido al proveedor y gestiona la logística consolidada
por barco bajo el **régimen courier** (hasta 50 kg y USD 3.000 por pedido, por
destinatario individual — el comprador es el importador).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- PostgreSQL + Prisma 6
- Auth propia: email + contraseña (scrypt) con sesiones en DB y cookie httpOnly.
  Roles: `CLIENTE`, `OPERADOR`, `ADMIN`.
- Pagos: capa abstracta `PaymentProvider` (`src/lib/payments/`) con dos
  implementaciones: `MockProvider` (dev, sin credenciales) y `StripeProvider`
  (test mode). Se elige con `PAYMENT_PROVIDER`.
- Emails: capa abstracta `Mailer` (`src/lib/mailer/`); en dev loguea a consola.

## Setup local

Requisitos: Node 20+, Docker (para Postgres).

```bash
# 1. Dependencias
npm install

# 2. Base de datos (Postgres 16 en Docker, puerto 54340)
docker run -d --name superplataforma-pg \
  -e POSTGRES_PASSWORD=superplataforma \
  -e POSTGRES_DB=superplataforma \
  -p 54340:5432 postgres:16-alpine

# 3. Variables de entorno
# .env ya trae valores de desarrollo que funcionan con el container de arriba.
# Para producción: cambiar SESSION_SECRET, DATABASE_URL y configurar Stripe/Resend.

# 4. Migraciones + seed
npx prisma migrate dev
npm run seed

# 5. Levantar
npm run dev
```

## Variables de entorno

| Variable | Qué es | Dev |
|---|---|---|
| `DATABASE_URL` | Conexión Postgres | apunta al Docker local |
| `SESSION_SECRET` | Secreto de sesiones | cambiar en producción |
| `PAYMENT_PROVIDER` | `mock` o `stripe` | `mock` (pantalla de pago simulada en `/pago/mock`) |
| `STRIPE_SECRET_KEY` | Clave test de Stripe | solo si `PAYMENT_PROVIDER=stripe` |
| `MAILER` | `console` (log) | `console` — los emails se ven en la consola del server |
| `NEXT_PUBLIC_APP_URL` | URL pública (links de emails y Stripe) | `http://localhost:3000` |

## Seed y usuarios demo

`npm run seed` limpia la base y carga: 5 proveedores (China/USA/España),
30 productos en 4 categorías, 8 pedidos en distintos estados y estos usuarios
(contraseña de todos: **`ecomex123`**):

| Email | Rol | Para qué |
|---|---|---|
| `ana@cliente.demo` | CLIENTE | comprar, ver "mis pedidos" |
| `bruno@cliente.demo` | CLIENTE | ídem |
| `carla@cliente.demo` | CLIENTE | ídem (usa CUIT) |
| `operador@ecomex.demo` | OPERADOR | `/operador` — cola de pedidos, avance de estados |
| `admin@ecomex.demo` | ADMIN | `/admin` — dashboard, CRUD de productos y proveedores |

## Flujo de compra (dev)

1. Agregás productos al carrito (sin login). El carrito muestra el progreso
   contra los topes courier (50 kg / USD 3.000) y bloquea el checkout si se pasan.
2. En checkout: DNI (7-8 dígitos) o CUIT (11, con dígito verificador) validado
   en vivo + dirección. Todo se re-valida en el servidor.
3. "Ir a pagar" te lleva a la pantalla del procesador simulado, donde aprobás
   o rechazás el pago.
4. Pago aprobado → pedido visible en "Mis pedidos" con timeline, email de
   confirmación en la consola del server, y el pedido entra a la cola del operador.
5. El operador avanza estados (solo transiciones válidas; cancelar exige motivo);
   cada avance dispara email al cliente y queda en el historial auditable.

## Estados logísticos

`PAGADO → COMPRADO_EN_ORIGEN → RECIBIDO_DEPOSITO_EXTERIOR → EMBARCADO →
EN_ADUANA → ENTREGADO`, más `CANCELADO` (desde cualquier estado previo a
EMBARCADO, con motivo obligatorio). Las transiciones se validan **en el
servidor** (`src/lib/estados.ts` + `src/lib/orders.ts`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `npm start` | build y server de producción |
| `npm run seed` | re-seed completo (destruye datos) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | typecheck |
| `npm test` | suite de tests (vitest): unitarios + integración |
| `npm run test:migrate` | migra la DB de test (correr una vez antes de `npm test`) |
| `npx prisma studio` | explorar la DB |

## Tests

La suite (52 tests) corre contra una **DB de test separada**
(`superplataforma_test`, en el mismo Docker — crearla una vez con
`docker exec superplataforma-pg psql -U postgres -c "CREATE DATABASE superplataforma_test"`
y luego `npm run test:migrate`):

- **Unitarios**: validación de DNI/CUIT (dígito verificador incluido), topes
  del régimen courier, máquina de estados logísticos, formato de moneda es-AR,
  hashing de contraseñas.
- **Integración** (`orders.integration.test.ts`): creación de pedidos con
  re-validación de topes en servidor, flujo de pago completo contra el
  provider mock (aprobado, rechazado, idempotencia), transiciones de estado
  válidas/inválidas, cancelación con motivo obligatorio y **reembolso
  automático** vía la capa de pagos, y el flujo feliz completo hasta ENTREGADO.

## Experiencia de compra

- **Búsqueda con autocomplete**: sugerencias con foto y precio final al tipear,
  búsquedas recientes (localStorage), navegación con teclado (↑ ↓ Enter Esc).
- **Filtros instantáneos** en el catálogo (sin botón "Aplicar"), con chips de
  filtros activos removibles y estado en la URL (compartible, back sano).
- **Precio de referencia local** (`referencePriceUsd`, opcional por producto):
  alimenta el precio tachado y el badge de ahorro ("-39%") en cards y ficha.
- **Favoritos** (♥, requiere sesión): página `/favoritos` con empty state.
- **"Seguí mirando"** en la home (vistos recientemente, cookie `sp_vistos`).
- **"También te puede interesar"** en la ficha (misma categoría).
- **Barra de compra fija** en mobile + badge NUEVO (< 30 días) en cards.
- Fecha estimada de entrega concreta en checkout y detalle del pedido.

## Notas de diseño

- **El cliente nunca ve el desglose del precio** (costo/flete/impuestos/margen):
  eso es solo para admin/operador. Al cliente se le comunica "precio final, nada
  más que pagar" en cada pantalla.
- Fotos de producto del seed: placeholders de `picsum.photos` (reemplazar por
  fotos reales al cargar catálogo).
- Entidades `ProcurementOrder`, `Shipment` y `StatusEvent` existen desde el día
  uno para que las fases futuras (compra automática, consolidación, tracking)
  entren sin reescritura; en esta fase las opera el equipo a mano.
