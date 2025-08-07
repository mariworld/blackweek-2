/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'suisse': ['Suisse Intl', 'sans-serif'],
      },
      fontWeight: {
        'semibold': 600,
        'bold': 700,
      }
    },
  },
  plugins: [],
}

