// tailwind.config.js
// En Tailwind v4 la configuración se hace en globals.css con @theme.
// Este archivo puede estar vacío o no existir.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};