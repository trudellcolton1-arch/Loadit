import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface palette — deep space / OS aesthetic
        void: "#04060B",
        ink: "#070A12",
        surface: "#0B0F1A",
        elevated: "#10151F",
        // Accents — the brand green "rail" energy
        rail: {
          DEFAULT: "#22A95C",
          50: "#E9FBF1",
          100: "#CFF5DF",
          400: "#34D17A",
          500: "#22A95C",
          600: "#1B8B4A",
        },
        cyan: {
          DEFAULT: "#22D3EE",
          glow: "#5EEAD4",
        },
        quantum: {
          DEFAULT: "#10B981",
          glow: "#5EEAD4",
        },
        signal: "#34D399", // success / settled
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(34,169,92,0.45)",
        "glow-cyan": "0 0 50px -10px rgba(34,211,238,0.5)",
        "glow-quantum": "0 0 50px -10px rgba(16,185,129,0.5)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 20px 60px -20px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,169,92,0.14), transparent 70%)",
        "rail-gradient":
          "linear-gradient(90deg, #5EEAD4 0%, #22C55E 50%, #15803D 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-rail": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 1.2s ease forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-rail": "pulse-rail 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
        "spin-slow": "spin-slow 24s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
