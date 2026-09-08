import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite aislar el build dir por env (evita que dos dev servers en la misma
  // carpeta corrompan el mismo .next). Default sigue siendo ".next".
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // AFIP SDK es una dependencia OPCIONAL (solo se usa con TAX_ID_VALIDATOR=afipsdk).
  // Marcarla external evita que el bundler intente resolverla en build cuando no
  // está instalada; se carga por require de runtime si algún día se instala.
  serverExternalPackages: ["@afipsdk/afip.js"],
  images: {
    // Las fotos reales de producto son locales (public/productos/); picsum solo
    // sirve el placeholder gris neutro hasta que se carguen.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
