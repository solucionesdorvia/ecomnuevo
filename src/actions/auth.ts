"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getMailer } from "@/lib/mailer";
import { passwordResetMail } from "@/lib/mailer/templates";

export type FormState = { error?: string; ok?: boolean };

// Solo se permite volver a rutas internas (nada de open redirects)
function safeReturnTo(raw: unknown): string | null {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre completo."),
  email: z.string().trim().toLowerCase().email("El email no es válido."),
  password: z.string().min(8, "La contraseña tiene que tener al menos 8 caracteres."),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya hay una cuenta con ese email. Probá ingresar." };

  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: "CLIENTE" },
  });
  await createSession(user.id);
  redirect(safeReturnTo(formData.get("volver")) ?? "/");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos." };
  }
  await createSession(user.id);
  const fallback = user.role === "ADMIN" ? "/admin" : user.role === "OPERADOR" ? "/operador" : "/";
  redirect(safeReturnTo(formData.get("volver")) ?? fallback);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Ingresá tu email." };
  const user = await db.user.findUnique({ where: { email } });
  // Siempre la misma respuesta: no revelamos si el email existe
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await getMailer().send(passwordResetMail({ to: user.email, name: user.name, token }));
  }
  return { ok: true };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = await db.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { error: "El link no es válido o ya venció. Pedí uno nuevo." };
  }
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await createSession(reset.userId);
  redirect("/");
}
