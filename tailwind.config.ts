import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        livoz: {
          blue: "#1E73F8",
          navy: "#08336E",
          cyan: "#22C7D6",
          yellow: "#FFC928",
          orange: "#FF861C",
          soft: "#F4FAFF",
        },
      },
      fontFamily: {
        title: ["Fredoka", "Nunito", "Arial", "sans-serif"],
        body: ["Nunito", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(23, 32, 51, 0.12)",
        card: "0 18px 45px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
