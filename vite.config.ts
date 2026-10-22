/** @file Jason Stys: offline UI build and core utility coverage; locations: docs/SOURCE_MAP.md. */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "ui",
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true },
  server: { proxy: { "/api": "http://127.0.0.1:8840" } },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/geometry.ts"],
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
  },
});
