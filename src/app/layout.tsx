import type { Metadata, Viewport } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Mono técnico/editorial para eyebrows, meta y datos (precio final, estados, contadores).
// Es la contraparte de Outfit en el sistema de diseño "traelo. v1".
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Traelo — Comprá directo de fábrica, recibí en tu casa",
    template: "%s — Traelo",
  },
  description:
    "Comprá directo de fábrica en China, con precio final sin sorpresas, y recibilo en tu casa. Lo viste en la fábrica, traelo.",
};

export const viewport: Viewport = {
  themeColor: "#0C2136", // tinta oceánica — barra del navegador en mobile
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  return (
    <html lang="es-AR" className={`${outfit.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        <Header user={user} cartCount={cart.count} />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
