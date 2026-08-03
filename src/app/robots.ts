import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nada de indexar panel interno, checkout ni cuentas
      disallow: ["/admin", "/operador", "/checkout", "/carrito", "/mis-pedidos", "/pago", "/ingresar", "/registrarme", "/recuperar"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
