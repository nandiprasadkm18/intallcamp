/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0f1d",
          navy: "#0f172a",
          card: "rgba(15, 23, 42, 0.6)",
          indigo: "#4f46e5",
          blue: "#2563eb",
          emerald: "#10b981",
          amber: "#f59e0b",
          slate: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ['"Bodoni MT"', 'serif'],
      },
      boxShadow: {
        'glow-indigo': '0 0 15px rgba(79, 70, 229, 0.15)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
