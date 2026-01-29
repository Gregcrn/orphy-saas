import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Orphy",
      formats: ["iife"],
      fileName: () => "orphy.js",
    },
    outDir: "dist",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});
