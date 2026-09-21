/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fons: {
          bg: "#0b0f19",
          card: "#111827",
          border: "#1f293d",
          accent: "#f59e0b",
          primary: "#6366f1"
        }
      }
    },
  },
  plugins: [],
}