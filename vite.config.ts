import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      port: 5173,
      // The browser only calls same-origin paths on the Vite server; Vite forwards them.
      // Result: no CORS configuration needed in development.
      proxy: {
        // /api/v1/... -> gateway (:8000), path unchanged
        "/api": {
          target: env.VITE_GATEWAY_URL ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      exclude: ["e2e/**", "node_modules/**"],
    },
  };
});