/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: 'rgb(var(--brand-300-rgb) / <alpha-value>)',
          400: '#FFA733',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
          text: 'var(--brand-text)',
        },
        'on-brand': 'var(--on-brand)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          hover: 'var(--sidebar-hover)',
          text: 'var(--sidebar-text)',
          active: 'var(--sidebar-text-active)',
        },
        page: 'var(--page)',
        surface: {
          DEFAULT: 'var(--surface)',
          light: 'var(--surface)',
          dark: 'var(--surface-dark)',
          50: 'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
          400: 'var(--surface-400)',
          500: 'var(--surface-500)',
          600: 'var(--surface-600)',
          700: 'var(--surface-700)',
          800: 'var(--surface-800)',
          900: 'var(--surface-900)',
          950: 'var(--surface-950)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border)',
        status: {
          booked: {
            bg: 'var(--status-booked-bg)',
            text: 'var(--status-booked-text)',
          },
          waiting: {
            bg: 'var(--status-waiting-bg)',
            text: 'var(--status-waiting-text)',
          },
          'in-service': {
            bg: 'var(--status-in-service-bg)',
            text: 'var(--status-in-service-text)',
          },
          done: {
            bg: 'var(--status-done-bg)',
            text: 'var(--status-done-text)',
          },
          'no-show': {
            bg: 'var(--status-no-show-bg)',
            text: 'var(--status-no-show-text)',
          },
          cancelled: {
            bg: 'var(--status-cancelled-bg)',
            text: 'var(--status-cancelled-text)',
          },
          neutral: {
            bg: 'var(--status-neutral-bg)',
            text: 'var(--status-neutral-text)',
          },
          success: {
            bg: 'var(--status-success-bg)',
            text: 'var(--status-success-text)',
          },
          warning: {
            bg: 'var(--status-warning-bg)',
            text: 'var(--status-warning-text)',
          },
          danger: {
            bg: 'var(--status-danger-bg)',
            text: 'var(--status-danger-text)',
          },
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'ui-sm': '8px',
        'ui-md': '12px',
        'ui-lg': '16px',
        'ui-xl': '20px',
      },
      boxShadow: {
        'ui-sm': '0 1px 3px rgb(24 24 24 / 0.08)',
        'ui-md': '0 6px 18px rgb(24 24 24 / 0.08)',
        'ui-lg': '0 12px 32px rgb(24 24 24 / 0.12)',
      },
      spacing: {
        '8pt-1': '8px',
        '8pt-2': '16px',
        '8pt-3': '24px',
        '8pt-4': '32px',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },
      screens: {
        xs: '375px',
      },
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
