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
        lavender: {
          50: "#FAF7FF",
          100: "#F8F5FF", // main background
          200: "#EEE7FF", // soft lavender
          300: "#D8C7FF", // lilac
          400: "#C4B5FD",
          500: "#A98AE8", // primary accent
          600: "#8B65D8",
          700: "#6D4CC3", // deep purple
          800: "#53389E",
          900: "#241A35", // heading text
        },
        bodytext: "#62566F",
        headingtext: "#241A35",
        status: {
          green: "#059669",
          greenLight: "#D1FAE5",
          greenBorder: "#A7F3D0",
        },
      },
      boxShadow: {
        lavender: "0 10px 30px -10px rgba(109, 76, 195, 0.12)",
        lavenderLg: "0 20px 40px -15px rgba(109, 76, 195, 0.18)",
        glass: "0 8px 32px 0 rgba(109, 76, 195, 0.08)",
        organicGlass: "0 24px 48px -12px rgba(109, 76, 195, 0.14), 0 0 0 1px rgba(216, 199, 255, 0.5) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.8) inset",
        heroPanel: "0 32px 64px -16px rgba(109, 76, 195, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.8) inset, 0 2px 8px 0 rgba(216, 199, 255, 0.4) inset",
      },
    },
  },
  plugins: [],
};
