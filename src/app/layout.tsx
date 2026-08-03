import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Traelo — Comprá afuera, recibí en tu casa",
    template: "%s — Traelo",
  },
  description:
    "Comprá directo a proveedores del exterior, con precio final sin sorpresas, y recibilo en tu casa. Lo viste afuera, traelo.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  return (
    <html lang="es-AR" className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header user={user} cartCount={cart.count} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
