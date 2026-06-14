/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: '#FFFBF5',
          100: '#FFF3E0',
          200: '#FFE0B2',
          300: '#FFCC80',
          400: '#FFA726',
          500: '#F97316',
          600: '#E65100',
          700: '#BF360C',
        },
        cream: '#FFFBF5',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
