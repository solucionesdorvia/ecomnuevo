import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";

const SESSION_COOKIE = "sp_session";
const SESSION_DAYS = 30;

export { hashPassword, verifyPassword } from "@/lib/password";

// ── Sesiones (cookie httpOnly + tabla Session) ───────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) await db.session.deleteMany({ where: { id } });
  cookieStore.delete(SESSION_COOKIE);
}

/** Usuario de la sesión actual, o null. Cacheado por request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id } }).catch(() => {});
    return null;
  }
  return session.user;
});

/** Exige sesión iniciada; redirige a /ingresar si no hay. */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar${returnTo ? `?volver=${encodeURIComponent(returnTo)}` : ""}`);
  return user;
}

/** Exige uno de los roles dados; 404 disfrazado vía redirect a home si no. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
