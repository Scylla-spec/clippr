/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Toggle via class on <html>
  theme: {
    extend: {
      colors: {
        // Brand palette — "Clippr" barbershop theme
        // Primary: warm amber (action, brand)
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // ← primary brand colour
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Surface: deep charcoal (dark mode base)
        surface: {
          50:  '#f8f8fb',
          100: '#f1f1f6',
          200: '#e4e4ee',
          300: '#c8c8dc',
          400: '#9898b8',
          500: '#6868a0',
          600: '#3d3d6e',
          700: '#252547',
          800: '#1a1a38',
          900: '#10101f', // ← darkest surface
          950: '#0a0a14',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px', // iPhone SE
      },
      // Minimum touch target size (WCAG 2.5.5)
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
