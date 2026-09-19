/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#070A11', // Ultra deep space background
          800: '#0B0F19', // Main body dark navy background
          700: '#111827', // Card dark background
          600: '#1E293B', // Panel deep blue background
          500: '#334155', // Subtle borders
        },
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          400: '#22d3ee',
          500: '#06b6d4', // Cyan primary highlight
          600: '#0891b2',
          700: '#0e7490',
        },
        risk: {
          safe: '#10B981',     // Green
          low: '#3B82F6',      // Blue
          medium: '#F59E0B',   // Amber/Orange
          high: '#EF4444',     // Red
          critical: '#9333EA', // Deep purple
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
