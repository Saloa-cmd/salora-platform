import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        surfaceSoft: "var(--surface-soft)",
        gold: "var(--gold)",
        goldSoft: "var(--gold-soft)",
        cream: "var(--cream)",
        muted: "var(--muted)",
        matcha: "var(--matcha)",
        espresso: "var(--espresso)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        luxury: "var(--shadow-floating)",
        glow: "0 0 80px color-mix(in srgb, var(--gold) 16%, transparent)"
      }
    }
  },
  plugins: []
};

export default config;
