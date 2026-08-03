"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type AdminFormState = { error?: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(",", "."));

const productSchema = z.object({
  title: z.string().trim().min(3, "El título es muy corto."),
  description: z.string().trim().min(10, "La descripción es muy corta."),
  category: z.enum(["ELECTRONICA", "HOGAR", "INDUMENTARIA", "HERRAMIENTAS"]),
  supplierId: z.string().min(1, "Elegí el proveedor."),
  images: z.array(z.string().url("Cada foto tiene que ser una URL válida.")).min(1, "Cargá al menos una foto."),
  weightKg: z.number().positive("El peso tiene que ser mayor a 0."),
  volumeM3: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  freightUsd: z.number().nonnegative(),
  taxesUsd: z.number().nonnegative(),
  marginUsd: z.number().nonnegative(),
  priceUsd: z.number().positive("El precio final tiene que ser mayor a 0."),
  referencePriceUsd: z.number().nonnegative().nullable(),
  deliveryDaysMin: z.number().int().positive(),
  deliveryDaysMax: z.number().int().positive(),
  featured: z.boolean(),
  active: z.boolean(),
});

export async function saveProduct(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const parsed = productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    supplierId: formData.get("supplierId"),
    images: String(formData.get("images") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    weightKg: num(formData.get("weightKg")),
    volumeM3: num(formData.get("volumeM3")),
    costUsd: num(formData.get("costUsd")),
    freightUsd: num(formData.get("freightUsd")),
    taxesUsd: num(formData.get("taxesUsd")),
    marginUsd: num(formData.get("marginUsd")),
    priceUsd: num(formData.get("priceUsd")),
    referencePriceUsd: String(formData.get("referencePriceUsd") ?? "").trim() ? num(formData.get("referencePriceUsd")) : null,
    deliveryDaysMin: num(formData.get("deliveryDaysMin")),
    deliveryDaysMax: num(formData.get("deliveryDaysMax")),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (data.deliveryDaysMax < data.deliveryDaysMin) {
    return { error: "El máximo de días de entrega no puede ser menor al mínimo." };
  }

  // Variantes: una dimensión (ej. Talle) con valores separados por coma
  const variantKind = String(formData.get("variantKind") ?? "").trim();
  const variantValues = String(formData.get("variantValues") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (variantValues.length > 0 && !variantKind) {
    return { error: "Poné el nombre de la variante (ej.: Talle o Color)." };
  }

  const { category, ...rest } = data;
  const baseData = { ...rest, category: category as Category };

  if (id) {
    const exists = await db.product.findUnique({ where: { id } });
    if (!exists) return { error: "El producto no existe." };
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: baseData });
      // Reemplazo de variantes: se desactivan las que ya no están (pueden estar
      // referenciadas por pedidos) y se crean las nuevas
      const current = await tx.productVariant.findMany({ where: { productId: id } });
      for (const v of current) {
        const still = variantKind && v.kind === variantKind && variantValues.includes(v.value);
        if (!still) await tx.productVariant.update({ where: { id: v.id }, data: { available: false } });
      }
      for (const value of variantValues) {
        const existing = current.find((v) => v.kind === variantKind && v.value === value);
        if (existing) {
          await tx.productVariant.update({ where: { id: existing.id }, data: { available: true } });
        } else {
          await tx.productVariant.create({ data: { productId: id, kind: variantKind, value } });
        }
      }
    });
  } else {
    let slug = slugify(data.title);
    if (await db.product.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    await db.product.create({
      data: {
        ...baseData,
        slug,
        variants: { create: variantValues.map((value) => ({ kind: variantKind, value })) },
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/admin/productos");
}

export async function toggleProductActive(id: string): Promise<void> {
  await requireRole("ADMIN");
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return;
  await db.product.update({ where: { id }, data: { active: !product.active } });
  revalidatePath("/admin/productos");
  revalidatePath("/", "layout");
}

const supplierSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto."),
  country: z.string().trim().min(2, "Ingresá el país."),
  depot: z.string().trim().min(2, "Ingresá el depósito de salida."),
  contactUrl: z.union([z.literal(""), z.string().url("El link no es válido.")]),
  notes: z.string().trim(),
});

export async function saveSupplier(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country"),
    depot: formData.get("depot"),
    contactUrl: String(formData.get("contactUrl") ?? "").trim(),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = {
    ...parsed.data,
    contactUrl: parsed.data.contactUrl || null,
    notes: parsed.data.notes || null,
    active: formData.get("active") === "on",
  };

  if (id) {
    await db.supplier.update({ where: { id }, data });
  } else {
    await db.supplier.create({ data });
  }
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}
