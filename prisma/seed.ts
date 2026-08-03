import { PrismaClient, type Category, type LogisticState } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

// Fotos placeholder estables (picsum con seed = mismo look en cada corrida)
const img = (slug: string, n: number) => `https://picsum.photos/seed/${slug}-${n}/800/1000`;

type ProductSeed = {
  slug: string;
  title: string;
  description: string;
  category: Category;
  supplier: string; // key del proveedor
  weightKg: number;
  volumeM3: number;
  costUsd: number;
  freightUsd: number;
  taxesUsd: number;
  marginUsd: number;
  featured?: boolean;
  variants?: { kind: string; values: string[] }[];
};

const SUPPLIERS = [
  { key: "shenzhen-tech", name: "Shenzhen Tech Trading Co.", country: "China", depot: "Depósito Shenzhen", contactUrl: "https://example.com/shenzhen-tech" },
  { key: "guangzhou-home", name: "Guangzhou Home & Living Ltd.", country: "China", depot: "Depósito Guangzhou", contactUrl: "https://example.com/guangzhou-home" },
  { key: "miami-gadgets", name: "Miami Gadgets LLC", country: "Estados Unidos", depot: "Depósito Miami", contactUrl: "https://example.com/miami-gadgets" },
  { key: "textil-valencia", name: "Textil Valencia S.L.", country: "España", depot: "Depósito Valencia", contactUrl: "https://example.com/textil-valencia" },
  { key: "yiwu-tools", name: "Yiwu Tools & Hardware Co.", country: "China", depot: "Depósito Yiwu", contactUrl: "https://example.com/yiwu-tools" },
];

const desc = (s: string) => `${s}\n\nComprado directo al proveedor del exterior. El precio incluye producto, flete marítimo e impuestos: no pagás nada más al recibirlo. Viaja consolidado en barco bajo régimen courier, a tu nombre.`;

const PRODUCTS: ProductSeed[] = [
  // ── Electrónica (Shenzhen / Miami) ──
  { slug: "auriculares-bt-anc", title: "Auriculares inalámbricos con cancelación de ruido", description: desc("Auriculares over-ear Bluetooth 5.3 con cancelación activa de ruido, 40 h de batería y carga rápida USB-C."), category: "ELECTRONICA", supplier: "shenzhen-tech", weightKg: 0.6, volumeM3: 0.003, costUsd: 38, freightUsd: 9, taxesUsd: 24, marginUsd: 18, featured: true, variants: [{ kind: "Color", values: ["Negro", "Blanco"] }] },
  { slug: "smartwatch-amoled", title: "Smartwatch AMOLED 1,8\" con GPS", description: desc("Reloj inteligente con pantalla AMOLED, GPS integrado, sensor de ritmo cardíaco y 7 días de batería."), category: "ELECTRONICA", supplier: "shenzhen-tech", weightKg: 0.25, volumeM3: 0.001, costUsd: 45, freightUsd: 7, taxesUsd: 27, marginUsd: 21, featured: true, variants: [{ kind: "Color", values: ["Negro", "Plata", "Rosa"] }] },
  { slug: "proyector-portatil-1080p", title: "Proyector portátil 1080p con Android TV", description: desc("Proyector LED compacto, 300 ANSI lúmenes, Android TV integrado, WiFi 5 y parlante propio."), category: "ELECTRONICA", supplier: "shenzhen-tech", weightKg: 1.4, volumeM3: 0.006, costUsd: 95, freightUsd: 16, taxesUsd: 55, marginUsd: 34 },
  { slug: "teclado-mecanico-75", title: "Teclado mecánico 75% hot-swap RGB", description: desc("Teclado mecánico compacto con switches intercambiables, retroiluminación RGB y cable USB-C desmontable."), category: "ELECTRONICA", supplier: "shenzhen-tech", weightKg: 0.9, volumeM3: 0.004, costUsd: 42, freightUsd: 10, taxesUsd: 26, marginUsd: 17, variants: [{ kind: "Color", values: ["Negro", "Blanco"] }] },
  { slug: "camara-accion-4k", title: "Cámara de acción 4K sumergible", description: desc("Cámara deportiva 4K/60fps con estabilización electrónica, carcasa sumergible 30 m y kit de montaje."), category: "ELECTRONICA", supplier: "miami-gadgets", weightKg: 0.5, volumeM3: 0.002, costUsd: 78, freightUsd: 12, taxesUsd: 45, marginUsd: 30 },
  { slug: "parlante-bt-ipx7", title: "Parlante Bluetooth IPX7 30W", description: desc("Parlante portátil resistente al agua con 30 W de potencia, 24 h de batería y modo estéreo de a pares."), category: "ELECTRONICA", supplier: "miami-gadgets", weightKg: 1.1, volumeM3: 0.004, costUsd: 36, freightUsd: 11, taxesUsd: 23, marginUsd: 15, featured: true },
  { slug: "tablet-11-128gb", title: "Tablet 11\" 128 GB con funda teclado", description: desc("Tablet Android 14 con pantalla 2K de 11 pulgadas, 8 GB de RAM, 128 GB y funda con teclado incluida."), category: "ELECTRONICA", supplier: "shenzhen-tech", weightKg: 1.2, volumeM3: 0.004, costUsd: 135, freightUsd: 14, taxesUsd: 74, marginUsd: 42 },
  { slug: "drone-camara-2k", title: "Drone plegable con cámara 2K", description: desc("Drone compacto con cámara 2K estabilizada, 25 minutos de vuelo, control por app y valija de transporte."), category: "ELECTRONICA", supplier: "miami-gadgets", weightKg: 0.8, volumeM3: 0.005, costUsd: 88, freightUsd: 13, taxesUsd: 50, marginUsd: 33 },
  // ── Hogar (Guangzhou) ──
  { slug: "freidora-aire-6l", title: "Freidora de aire 6 L digital", description: desc("Freidora de aire con canasto de 6 litros, panel táctil, 8 programas y canasto apto lavavajillas."), category: "HOGAR", supplier: "guangzhou-home", weightKg: 4.8, volumeM3: 0.03, costUsd: 48, freightUsd: 26, taxesUsd: 37, marginUsd: 21, featured: true },
  { slug: "aspiradora-robot-lidar", title: "Aspiradora robot con mapeo láser", description: desc("Robot aspirador con navegación LiDAR, 3.000 Pa de succión, mopa y control por app."), category: "HOGAR", supplier: "guangzhou-home", weightKg: 5.5, volumeM3: 0.04, costUsd: 132, freightUsd: 32, taxesUsd: 82, marginUsd: 46 },
  { slug: "cafetera-espresso-20bar", title: "Cafetera espresso 20 bares con vaporizador", description: desc("Cafetera espresso compacta de 20 bares con lanza de vapor para latte art y depósito de 1,5 L."), category: "HOGAR", supplier: "guangzhou-home", weightKg: 4.2, volumeM3: 0.025, costUsd: 72, freightUsd: 24, taxesUsd: 48, marginUsd: 28 },
  { slug: "purificador-aire-hepa", title: "Purificador de aire HEPA H13", description: desc("Purificador con filtro HEPA H13 real, sensor de calidad de aire y modo nocturno silencioso, hasta 40 m²."), category: "HOGAR", supplier: "guangzhou-home", weightKg: 3.6, volumeM3: 0.03, costUsd: 58, freightUsd: 22, taxesUsd: 40, marginUsd: 24 },
  { slug: "lampara-piso-arco", title: "Lámpara de pie de arco nórdica", description: desc("Lámpara de pie con brazo de arco, pantalla de tela y base de mármol. Incluye lámpara LED cálida."), category: "HOGAR", supplier: "guangzhou-home", weightKg: 6.5, volumeM3: 0.05, costUsd: 44, freightUsd: 30, taxesUsd: 37, marginUsd: 19 },
  { slug: "juego-sabanas-lino", title: "Juego de sábanas de lino lavado — queen", description: desc("Juego queen de lino 100% lavado a la piedra: sábana, ajustable y dos fundas. Fresco en verano, abrigado en invierno."), category: "HOGAR", supplier: "textil-valencia", weightKg: 2.1, volumeM3: 0.008, costUsd: 65, freightUsd: 14, taxesUsd: 40, marginUsd: 26, variants: [{ kind: "Color", values: ["Natural", "Gris piedra", "Terracota"] }] },
  { slug: "vajilla-gres-12", title: "Vajilla de gres artesanal — 12 piezas", description: desc("Set de 12 piezas de gres esmaltado a mano: 4 platos playos, 4 hondos y 4 bowls. Apta microondas y lavavajillas."), category: "HOGAR", supplier: "textil-valencia", weightKg: 7.8, volumeM3: 0.03, costUsd: 52, freightUsd: 34, taxesUsd: 43, marginUsd: 21 },
  { slug: "manta-tejida-algodon", title: "Manta tejida de algodón orgánico", description: desc("Manta de algodón orgánico tejido, 130×170 cm, con flecos. Ideal sillón o pie de cama."), category: "HOGAR", supplier: "textil-valencia", weightKg: 1.3, volumeM3: 0.006, costUsd: 28, freightUsd: 9, taxesUsd: 19, marginUsd: 12, variants: [{ kind: "Color", values: ["Crudo", "Verde salvia", "Mostaza"] }] },
  // ── Indumentaria (Valencia / Guangzhou) ──
  { slug: "campera-puffer-reciclada", title: "Campera puffer de poliéster reciclado", description: desc("Campera inflada liviana con relleno sintético, repelente al agua y bolsillos con cierre. Se comprime en su propia bolsa."), category: "INDUMENTARIA", supplier: "textil-valencia", weightKg: 0.9, volumeM3: 0.005, costUsd: 42, freightUsd: 10, taxesUsd: 27, marginUsd: 17, featured: true, variants: [{ kind: "Talle", values: ["S", "M", "L", "XL"] }] },
  { slug: "zapatillas-running-carbon", title: "Zapatillas de running con placa de carbono", description: desc("Zapatillas de entrenamiento con placa de fibra de carbono, drop 8 mm y mediasuela reactiva."), category: "INDUMENTARIA", supplier: "guangzhou-home", weightKg: 0.8, volumeM3: 0.006, costUsd: 55, freightUsd: 11, taxesUsd: 34, marginUsd: 22, variants: [{ kind: "Talle", values: ["39", "40", "41", "42", "43", "44"] }] },
  { slug: "buzo-frisa-oversize", title: "Buzo de frisa premium oversize", description: desc("Buzo de algodón frisado 480 g/m², corte oversize, costuras reforzadas y puños canelados."), category: "INDUMENTARIA", supplier: "textil-valencia", weightKg: 0.7, volumeM3: 0.004, costUsd: 24, freightUsd: 8, taxesUsd: 16, marginUsd: 10, variants: [{ kind: "Talle", values: ["S", "M", "L", "XL"] }] },
  { slug: "jean-recto-rigido", title: "Jean recto de denim rígido 14 oz", description: desc("Jean de corte recto en denim rígido de 14 onzas, tiro medio, con botones metálicos."), category: "INDUMENTARIA", supplier: "textil-valencia", weightKg: 0.8, volumeM3: 0.004, costUsd: 32, freightUsd: 9, taxesUsd: 21, marginUsd: 13, variants: [{ kind: "Talle", values: ["38", "40", "42", "44", "46"] }] },
  { slug: "remera-merino", title: "Remera de lana merino ultrafina", description: desc("Remera de lana merino de 150 g/m²: regula temperatura, no retiene olor y seca rápido."), category: "INDUMENTARIA", supplier: "textil-valencia", weightKg: 0.25, volumeM3: 0.001, costUsd: 29, freightUsd: 5, taxesUsd: 18, marginUsd: 12, variants: [{ kind: "Talle", values: ["S", "M", "L", "XL"] }] },
  { slug: "mochila-urbana-antirrobo", title: "Mochila urbana antirrobo 20 L", description: desc("Mochila con cierre oculto, puerto USB, funda notebook 15,6\" y tela repelente al agua."), category: "INDUMENTARIA", supplier: "guangzhou-home", weightKg: 0.9, volumeM3: 0.008, costUsd: 26, freightUsd: 9, taxesUsd: 17, marginUsd: 11, featured: true },
  { slug: "anteojos-sol-polarizados", title: "Anteojos de sol polarizados UV400", description: desc("Anteojos con lentes polarizadas UV400, marco de acetato liviano y estuche rígido incluido."), category: "INDUMENTARIA", supplier: "miami-gadgets", weightKg: 0.2, volumeM3: 0.001, costUsd: 18, freightUsd: 4, taxesUsd: 11, marginUsd: 8 },
  // ── Herramientas (Yiwu / Miami) ──
  { slug: "atornillador-inalambrico-21v", title: "Atornillador inalámbrico 21V con 2 baterías", description: desc("Taladro atornillador de 21 V con dos baterías de litio, 25 puntos de torque, maletín y 40 accesorios."), category: "HERRAMIENTAS", supplier: "yiwu-tools", weightKg: 3.2, volumeM3: 0.015, costUsd: 46, freightUsd: 20, taxesUsd: 33, marginUsd: 18, featured: true },
  { slug: "kit-herramientas-168", title: "Kit de herramientas 168 piezas con maletín", description: desc("Set completo de 168 piezas cromo-vanadio: tubos, llaves, destornilladores y pinzas en maletín rígido."), category: "HERRAMIENTAS", supplier: "yiwu-tools", weightKg: 8.5, volumeM3: 0.02, costUsd: 58, freightUsd: 38, taxesUsd: 48, marginUsd: 24 },
  { slug: "sierra-circular-mini", title: "Mini sierra circular 700W con guía láser", description: desc("Sierra circular compacta de 700 W con guía láser, discos para madera, metal y cerámica."), category: "HERRAMIENTAS", supplier: "yiwu-tools", weightKg: 2.9, volumeM3: 0.012, costUsd: 39, freightUsd: 18, taxesUsd: 29, marginUsd: 15 },
  { slug: "estacion-soldado-digital", title: "Estación de soldado digital 60W", description: desc("Estación de soldadura con control digital de temperatura, punta cerámica y soporte con esponja."), category: "HERRAMIENTAS", supplier: "shenzhen-tech", weightKg: 1.8, volumeM3: 0.008, costUsd: 31, freightUsd: 13, taxesUsd: 22, marginUsd: 11 },
  { slug: "multimetro-automotor", title: "Multímetro digital automotor True RMS", description: desc("Multímetro True RMS con medición de temperatura, capacitancia y prueba de diodos. Incluye puntas y funda."), category: "HERRAMIENTAS", supplier: "miami-gadgets", weightKg: 0.6, volumeM3: 0.002, costUsd: 27, freightUsd: 7, taxesUsd: 17, marginUsd: 10 },
  { slug: "compresor-portatil-digital", title: "Compresor de aire portátil digital", description: desc("Inflador eléctrico con presostato digital, apagado automático, linterna y adaptadores para auto, bici y pelotas."), category: "HERRAMIENTAS", supplier: "yiwu-tools", weightKg: 1.2, volumeM3: 0.004, costUsd: 24, freightUsd: 10, taxesUsd: 17, marginUsd: 9 },
  { slug: "organizador-taller-pared", title: "Panel organizador de taller 120×60", description: desc("Panel perforado metálico con 40 ganchos y estantes para colgar herramientas. Se fija a la pared."), category: "HERRAMIENTAS", supplier: "yiwu-tools", weightKg: 9.5, volumeM3: 0.04, costUsd: 36, freightUsd: 42, taxesUsd: 39, marginUsd: 17 },
];

async function main() {
  console.log("Limpiando base…");
  await db.$transaction([
    db.statusEvent.deleteMany(),
    db.shipment.deleteMany(),
    db.procurementOrder.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.productVariant.deleteMany(),
    db.product.deleteMany(),
    db.supplier.deleteMany(),
    db.passwordReset.deleteMany(),
    db.session.deleteMany(),
    db.address.deleteMany(),
    db.user.deleteMany(),
  ]);

  console.log("Proveedores…");
  const supplierIds: Record<string, string> = {};
  for (const s of SUPPLIERS) {
    const created = await db.supplier.create({
      data: { name: s.name, country: s.country, depot: s.depot, contactUrl: s.contactUrl },
    });
    supplierIds[s.key] = created.id;
  }

  console.log("Productos…");
  const productIds: Record<string, string> = {};
  const REF_MULT: Record<Category, number> = { ELECTRONICA: 1.75, HOGAR: 1.55, INDUMENTARIA: 1.45, HERRAMIENTAS: 1.65 };
  for (const p of PRODUCTS) {
    const priceUsd = p.costUsd + p.freightUsd + p.taxesUsd + p.marginUsd;
    // ~2 de cada 3 productos tienen precio local de referencia (badge de ahorro)
    const referencePriceUsd = p.slug.length % 3 !== 0 ? Math.round(priceUsd * REF_MULT[p.category]) : null;
    const created = await db.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        category: p.category,
        images: [img(p.slug, 1), img(p.slug, 2), img(p.slug, 3)],
        supplierId: supplierIds[p.supplier],
        weightKg: p.weightKg,
        volumeM3: p.volumeM3,
        costUsd: p.costUsd,
        freightUsd: p.freightUsd,
        taxesUsd: p.taxesUsd,
        marginUsd: p.marginUsd,
        priceUsd,
        referencePriceUsd,
        featured: p.featured ?? false,
        variants: p.variants
          ? {
              create: p.variants.flatMap((v) => v.values.map((value) => ({ kind: v.kind, value }))),
            }
          : undefined,
      },
    });
    productIds[p.slug] = created.id;
  }

  console.log("Usuarios…");
  const password = await hashPassword("ecomex123");
  const [ana, bruno, carla, operador] = await Promise.all(
    [
      { email: "ana@cliente.demo", name: "Ana Pereyra", role: "CLIENTE", docType: "DNI", docNumber: "32456789" },
      { email: "bruno@cliente.demo", name: "Bruno Sosa", role: "CLIENTE", docType: "DNI", docNumber: "28901234" },
      { email: "carla@cliente.demo", name: "Carla Giménez", role: "CLIENTE", docType: "CUIT", docNumber: "27289012341" },
      { email: "operador@ecomex.demo", name: "Martín Operador", role: "OPERADOR" },
      { email: "admin@ecomex.demo", name: "Andrea Admin", role: "ADMIN" },
    ].map((u) =>
      db.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role as "CLIENTE" | "OPERADOR" | "ADMIN",
          passwordHash: password,
          docType: (u.docType as "DNI" | "CUIT") ?? null,
          docNumber: u.docNumber ?? null,
        },
      }),
    ),
  );

  const addresses = await Promise.all([
    db.address.create({ data: { userId: ana.id, street: "Av. Rivadavia 4521, 3º B", city: "CABA", province: "Ciudad Autónoma de Buenos Aires", zipCode: "C1424", phone: "11 5555-1234", isDefault: true } }),
    db.address.create({ data: { userId: bruno.id, street: "Calle 12 nº 1534", city: "La Plata", province: "Buenos Aires", zipCode: "B1900", phone: "221 555-6789", isDefault: true } }),
    db.address.create({ data: { userId: carla.id, street: "Bv. Oroño 812", city: "Rosario", province: "Santa Fe", zipCode: "S2000", phone: "341 555-4321", isDefault: true } }),
  ]);
  const addrByUser: Record<string, string> = {
    [ana.id]: addresses[0].id,
    [bruno.id]: addresses[1].id,
    [carla.id]: addresses[2].id,
  };

  console.log("Pedidos…");
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  type OrderSeed = {
    user: typeof ana;
    items: { slug: string; qty: number }[];
    state: LogisticState;
    createdDaysAgo: number;
    cancelReason?: string;
  };
  const ORDERS: OrderSeed[] = [
    { user: ana, items: [{ slug: "auriculares-bt-anc", qty: 1 }, { slug: "smartwatch-amoled", qty: 1 }], state: "PAGADO", createdDaysAgo: 2 },
    { user: bruno, items: [{ slug: "freidora-aire-6l", qty: 1 }], state: "PAGADO", createdDaysAgo: 4 },
    { user: carla, items: [{ slug: "atornillador-inalambrico-21v", qty: 1 }, { slug: "multimetro-automotor", qty: 1 }], state: "COMPRADO_EN_ORIGEN", createdDaysAgo: 9 },
    { user: ana, items: [{ slug: "campera-puffer-reciclada", qty: 2 }], state: "RECIBIDO_DEPOSITO_EXTERIOR", createdDaysAgo: 16 },
    { user: bruno, items: [{ slug: "tablet-11-128gb", qty: 1 }, { slug: "teclado-mecanico-75", qty: 1 }], state: "EMBARCADO", createdDaysAgo: 28 },
    { user: carla, items: [{ slug: "aspiradora-robot-lidar", qty: 1 }], state: "EN_ADUANA", createdDaysAgo: 52 },
    { user: ana, items: [{ slug: "parlante-bt-ipx7", qty: 1 }, { slug: "anteojos-sol-polarizados", qty: 2 }], state: "ENTREGADO", createdDaysAgo: 70 },
    { user: bruno, items: [{ slug: "drone-camara-2k", qty: 1 }], state: "CANCELADO", createdDaysAgo: 12, cancelReason: "El proveedor discontinuó el modelo; se reembolsó el pago." },
  ];

  const FLOW: LogisticState[] = ["PAGADO", "COMPRADO_EN_ORIGEN", "RECIBIDO_DEPOSITO_EXTERIOR", "EMBARCADO", "EN_ADUANA", "ENTREGADO"];
  const SHIP_FIELD: Record<string, string> = {
    COMPRADO_EN_ORIGEN: "boughtAt",
    RECIBIDO_DEPOSITO_EXTERIOR: "atDepotAt",
    EMBARCADO: "shippedAt",
    EN_ADUANA: "atCustomsAt",
    ENTREGADO: "deliveredAt",
  };

  for (const o of ORDERS) {
    const products = await db.product.findMany({
      where: { id: { in: o.items.map((i) => productIds[i.slug]) } },
    });
    const items = o.items.map((i) => {
      const p = products.find((pp) => pp.id === productIds[i.slug])!;
      return { product: p, qty: i.qty };
    });
    const totalUsd = items.reduce((a, i) => a + i.product.priceUsd.toNumber() * i.qty, 0);
    const totalWeightKg = items.reduce((a, i) => a + i.product.weightKg.toNumber() * i.qty, 0);
    const createdAt = daysAgo(o.createdDaysAgo);

    const order = await db.order.create({
      data: {
        userId: o.user.id,
        addressId: addrByUser[o.user.id],
        docType: o.user.docType!,
        docNumber: o.user.docNumber!,
        itemsUsd: totalUsd,
        totalUsd,
        totalWeightKg,
        paymentStatus: o.state === "CANCELADO" ? "REEMBOLSADO" : "PAGADO",
        paymentProvider: "mock",
        paymentExternalId: `mock_seed_${o.createdDaysAgo}`,
        state: o.state,
        cancelReason: o.cancelReason,
        createdAt,
        items: {
          create: items.map((i) => ({
            productId: i.product.id,
            quantity: i.qty,
            unitPriceUsd: i.product.priceUsd,
            unitWeightKg: i.product.weightKg,
          })),
        },
      },
    });

    // Historial de eventos + fechas del shipment coherentes con el estado
    const reachedStates =
      o.state === "CANCELADO" ? (["PAGADO", "CANCELADO"] as LogisticState[]) : FLOW.slice(0, FLOW.indexOf(o.state) + 1);
    const stepDays = o.createdDaysAgo / reachedStates.length;
    const shipmentDates: Record<string, Date> = {};
    for (let i = 0; i < reachedStates.length; i++) {
      const at = daysAgo(o.createdDaysAgo - stepDays * i);
      const to = reachedStates[i];
      await db.statusEvent.create({
        data: {
          orderId: order.id,
          fromState: i === 0 ? null : reachedStates[i - 1],
          toState: to,
          note: to === "PAGADO" ? "Pago confirmado" : to === "CANCELADO" ? o.cancelReason : null,
          actorId: i === 0 ? null : operador.id,
          createdAt: at,
        },
      });
      if (SHIP_FIELD[to]) shipmentDates[SHIP_FIELD[to]] = at;
    }
    await db.shipment.create({ data: { orderId: order.id, createdAt, ...shipmentDates } });

    // Una ProcurementOrder por proveedor involucrado
    const supplierSet = [...new Set(items.map((i) => i.product.supplierId))];
    const reachedIdx = FLOW.indexOf(o.state);
    for (const supplierId of supplierSet) {
      await db.procurementOrder.create({
        data: {
          orderId: order.id,
          supplierId,
          status:
            o.state === "CANCELADO" || reachedIdx < 1
              ? "PENDIENTE"
              : reachedIdx < 2
                ? "COMPRADO"
                : "RECIBIDO_EN_DEPOSITO",
          createdAt,
        },
      });
    }
  }

  const counts = {
    proveedores: await db.supplier.count(),
    productos: await db.product.count(),
    usuarios: await db.user.count(),
    pedidos: await db.order.count(),
    eventos: await db.statusEvent.count(),
  };
  console.log("Seed OK:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
