import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#111111",
        surfaceSoft: "#181614",
        gold: "#C9A45C",
        goldSoft: "#E7D3A1",
        cream: "#F5EFE3",
        muted: "#9C9387",
        matcha: "#9CAF88",
        espresso: "#3A2418"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        luxury: "0 18px 60px rgba(0,0,0,0.42)",
        glow: "0 0 80px rgba(201,164,92,0.16)"
      }
    }
  },
  plugins: []
};

export default config;
