import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arvato: {
          blue: "#007FE2",
          "dark-grey": "#333333",
          "mid-grey": "#808080",
          "light-grey": "#CCCCCC",
          red: "#D11A4C",
          "ice-blue": "#0BBBE4",
        },
      },
      fontFamily: {
        nunito: ["NunitoSans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
