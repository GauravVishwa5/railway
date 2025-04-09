/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#daeee3',
          200: '#b6ddca',
          300: '#8cc6aa',
          400: '#5faa85',
          500: '#3f8f67',
          600: '#2f7452',
          700: '#265e44',
          800: '#204a37',
          900: '#1a3d2e',
          950: '#0d261b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 4s infinite',
      }
    },
  },
  plugins: [],
};