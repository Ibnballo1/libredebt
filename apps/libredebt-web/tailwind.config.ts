/**
 * tailwind.config.ts
 *
 * In Tailwind v4, the design tokens (colors, fonts, radius) are defined
 * in globals.css using the @theme directive — NOT here.
 *
 * This file is kept for plugin registration only.
 * Do NOT add color or theme extensions here; they belong in globals.css.
 */
import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  plugins: [tailwindAnimate],
};

export default config;
