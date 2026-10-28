import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, googleEnabled, startGoogleAuth } from "@/lib/google-oauth";

// GET /api/auth/google?volver=/checkout → redirige al consentimiento de Google
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/ingresar", req.url));
  const raw = req.nextUrl.searchParams.get("volver");
  const volver = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;

  const { url, state, verifier } = startGoogleAuth();
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_COOKIE, JSON.stringify({ state, verifier, volver }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
