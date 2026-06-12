import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#f0f9ff", 100: "#e0f2fe", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 900: "#0c4a6e", 950: "#082f49" },
        accent: { DEFAULT: "#f59e0b", dark: "#d97706" },
        surface: { dark: "#0f172a", muted: "#f8fafc" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      boxShadow: { premium: "0 25px 50px -12px rgba(0,0,0,0.15)", card: "0 4px 24px rgba(0,0,0,0.06)" },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
