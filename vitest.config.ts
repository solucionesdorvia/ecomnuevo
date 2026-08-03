import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Los módulos de servidor importan "server-only" (paquete que explota
      // fuera de Next). En tests corre todo en Node: se stubbea.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Los tests de integración comparten la DB de test: nada de paralelismo
    fileParallelism: false,
    testTimeout: 15000,
  },
});
