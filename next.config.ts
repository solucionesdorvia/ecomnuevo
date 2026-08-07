import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos reales de producto son locales (public/productos/); picsum solo
    // sirve el placeholder gris neutro hasta que se carguen.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
