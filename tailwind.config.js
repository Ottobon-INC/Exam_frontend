import frappeuiPlugin from 'frappe-ui/tailwind'
import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [frappeuiPlugin],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: colors.zinc,
        emerald: colors.emerald,
      }
    },
  },
  plugins: [],
}