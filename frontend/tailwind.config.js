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
        surface: {
          900: "#090B0E",
          800: "#11141A",
          700: "#1A1F28",
        },
        zentro: {
          primary: "#10B981", // restrained emerald / mint accent
          dim: "#064E3B",
          glow: "rgba(16, 185, 129, 0.2)",
        },
      },
    },
  },
  plugins: [],
};
