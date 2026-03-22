import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/qr/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arvato: {
          blue: "#007FE2",
          black: "#000000",
          "dark-grey": "#333333",
          "middle-grey": "#808080",
          "light-grey": "#CCCCCC",
          white: "#FFFFFF",
          "ruby-red": "#D11A4C",
          "ice-blue": "#0BBBE4",
          green: "#22C55E",
          orange: "#F97316",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
      },
      fontFamily: {
        nunito: ["NunitoSans", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
