/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#2dd4bf",
        strong: "#34d399",
        mid: "#f59e0b",
        weak: "#ef4444",
        background: "#0c0f14",
        panel: "#121720",
        panelBorder: "#263344",
        muted: "#94a3b8"
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      }
    },
  },
  plugins: [],
};
