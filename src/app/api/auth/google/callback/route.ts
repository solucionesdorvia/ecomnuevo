import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { exchangeGoogleCode, GOOGLE_COOKIE } from "@/lib/google-oauth";

export async function GET(req: NextRequest) {
  const fail = () => {
    const res = NextResponse.redirect(new URL("/ingresar?error=google", req.url));
    res.cookies.delete(GOOGLE_COOKIE);
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const raw = req.cookies.get(GOOGLE_COOKIE)?.value;
  if (!code || !state || !raw) return fail();

  let saved: { state: string; verifier: string; volver: string | null };
  try {
    saved = JSON.parse(raw);
  } catch {
    return fail();
  }
  if (saved.state !== state) return fail();

  try {
    const profile = await exchangeGoogleCode(code, saved.verifier);

    // 1) ya vinculado · 2) misma cuenta por email (Google lo verificó) → vincular · 3) cuenta nueva
    let user = await db.user.findUnique({ where: { googleId: profile.sub } });
    if (!user) {
      const byEmail = await db.user.findUnique({ where: { email: profile.email } });
      user = byEmail
        ? await db.user.update({
            where: { id: byEmail.id },
            data: {
              googleId: profile.sub,
              emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
              image: byEmail.image ?? profile.picture,
            },
          })
        : await db.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              googleId: profile.sub,
              image: profile.picture,
              emailVerifiedAt: new Date(),
              role: "CLIENTE",
            },
          });
    }

    await createSession(user.id);
    const fallback = user.role === "ADMIN" ? "/admin" : user.role === "OPERADOR" ? "/operador" : "/";
    const res = NextResponse.redirect(new URL(saved.volver ?? fallback, req.url));
    res.cookies.delete(GOOGLE_COOKIE);
    return res;
  } catch (err) {
    console.error("[google-oauth]", err);
    return fail();
  }
}
