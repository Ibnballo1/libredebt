/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        emerald: { DEFAULT: "#10B981", dark: "#059669" },
        sky: "#38BDF8",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        muted: "#64748B",
        subtle: "#94A3B8",
      },
    },
  },
  plugins: [],
}
