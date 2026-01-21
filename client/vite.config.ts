import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    dedupe: ["react", "react-dom"]
  },

  optimizeDeps: {
    exclude: ["lucide-react"]
  },

  build: {
    outDir: "dist",
    sourcemap: false
  },

  server: {
    port: 5173
  }
});
