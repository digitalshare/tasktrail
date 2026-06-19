import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  // Absolute paths so globs resolve regardless of the process cwd.
  content: [resolve(here, "index.html"), resolve(here, "src/**/*.{ts,tsx}")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f59e0b", // amber — safety/hi-vis
          dark: "#b45309",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
