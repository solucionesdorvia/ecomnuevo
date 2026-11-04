import "server-only";
import { createHash, randomBytes } from "node:crypto";

// OAuth 2.0 / OpenID Connect con Google, sin librerías: authorization code + PKCE.
// El id_token se recibe directo del token endpoint de Google por TLS, así que
// (según OIDC Core §3.1.3.7) alcanza con validar iss/aud/exp sin verificar la firma.

export const GOOGLE_COOKIE = "sp_google_oauth";

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function redirectUri(): string {
  return `${appUrl()}/api/auth/google/callback`;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export function startGoogleAuth(): { url: string; state: string; verifier: string } {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state, verifier };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export async function exchangeGoogleCode(code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token endpoint respondió ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google no devolvió id_token");

  const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as {
    iss: string;
    aud: string;
    exp: number;
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!["https://accounts.google.com", "accounts.google.com"].includes(payload.iss)) throw new Error("iss inválido");
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("aud inválido");
  if (payload.exp * 1000 < Date.now()) throw new Error("id_token vencido");
  if (!payload.email || !payload.email_verified) throw new Error("email de Google sin verificar");

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
    picture: payload.picture,
  };
}
