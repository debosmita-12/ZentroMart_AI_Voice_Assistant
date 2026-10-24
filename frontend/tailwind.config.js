/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Authoritative warm-neutral palette from reference image:
        // Warm ivory, soft sand, muted taupe, deep charcoal, and champagne gold
        warm: {
          50: "#FAF8F5",
          100: "#F5F1E9", // Main background: warm ivory
          200: "#E9E2D7", // Secondary background: soft sand
          300: "#DDD3C2", // Neutral champagne border
          400: "#C9A77B", // Restrained champagne gold accent
          500: "#B88E56", // Warm amber gold
          600: "#8C6D42", // Deep bronze
          700: "#5E4B33", // Deep warm taupe
          800: "#3E3529", // Dark walnut
          900: "#292621", // Primary text: deep warm charcoal
        },
        charcoal: "#292621",
        taupe: "#777064",
        sand: "#E9E2D7",
        champagne: {
          DEFAULT: "#C9A77B",
          light: "#EFE5D5",
          gold: "#D4B483",
          dark: "#A67F4E",
        },
        headingtext: "#292621",
        bodytext: "#777064",
        status: {
          green: "#1B633E",
          greenLight: "#E8F5EE",
          greenBorder: "#BDE3CE",
        },
      },
      boxShadow: {
        warmGlass: "0 12px 36px -8px rgba(60, 50, 40, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
        warmLg: "0 24px 48px -12px rgba(60, 50, 40, 0.12), 0 0 0 1px rgba(216, 206, 194, 0.6) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.95) inset",
        goldGlow: "0 0 30px 6px rgba(201, 167, 123, 0.45), 0 10px 24px -4px rgba(60, 50, 40, 0.14)",
        goldGlowLg: "0 0 42px 10px rgba(201, 167, 123, 0.6), 0 14px 32px -4px rgba(60, 50, 40, 0.18)",
        glass: "0 10px 32px 0 rgba(60, 50, 40, 0.07)",
        organicGlass: "0 24px 48px -12px rgba(60, 50, 40, 0.10), 0 0 0 1px rgba(216, 206, 194, 0.5) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.9) inset",
        heroPanel: "0 32px 64px -16px rgba(60, 50, 40, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.9) inset, 0 2px 8px 0 rgba(201, 167, 123, 0.2) inset",
      },
    },
  },
  plugins: [],
};
