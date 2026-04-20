/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        },
        wolf: {
          400: '#e94560',
          500: '#c73652',
        },
        moon: {
          300: '#f5e6ca',
          400: '#e8d5b7',
        }
      }
    },
  },
  plugins: [],
}
