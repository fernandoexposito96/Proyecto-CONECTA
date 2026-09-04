import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020",
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        almacen: resolve(__dirname, "almacen.html"),
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase/")) return "vendor-supabase";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("qrcode.react")) return "vendor-qrcode";
          if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
          return "vendor";
        },
      },
    },
  },
});
