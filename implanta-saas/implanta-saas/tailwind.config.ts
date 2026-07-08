import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta provisória — trocar na etapa de identidade visual.
        brand: {
          50: "#f0f9f6",
          500: "#0f9d74",
          600: "#0c7f5e",
          900: "#0a3d2e",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
