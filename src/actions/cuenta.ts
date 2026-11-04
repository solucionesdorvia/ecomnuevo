"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { validateDocumento } from "@/lib/documento";
import type { FormState } from "@/actions/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre completo."),
  doc: z.string().trim(),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/cuenta");
  const parsed = schema.safeParse({ name: formData.get("name"), doc: formData.get("doc") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let docData: { docType: "DNI" | "CUIT" | null; docNumber: string | null } = { docType: null, docNumber: null };
  if (parsed.data.doc) {
    const doc = validateDocumento(parsed.data.doc);
    if (!doc.ok) return { error: doc.error };
    docData = { docType: doc.type, docNumber: doc.normalized };
  }

  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, ...docData } });
  revalidatePath("/", "layout");
  return { ok: true };
}
