import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    // Explicit config path: Tailwind's auto-discovery uses the process cwd
    // (repo root), but our config lives in web/.
    tailwindcss: { config: resolve(here, "tailwind.config.js") },
    autoprefixer: {},
  },
};
