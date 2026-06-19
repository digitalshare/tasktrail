import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Run via `npm run web:dev` from the repo root (config passed with --config).
export default defineConfig({
  root: resolve(__dirname),
  // .env lives at the repo root, one level up from web/.
  envDir: resolve(__dirname, ".."),
  plugins: [react()],
  server: { port: 5173, host: true },
});
