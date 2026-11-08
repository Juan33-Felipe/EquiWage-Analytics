/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-light': 'var(--color-surface-light)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FDBA74',
        },
        danger: '#EF4444',
        success: '#10B981',
        content: {
          main: 'var(--color-content-main)',
          muted: 'var(--color-content-muted)',
        },
        sidebar: 'var(--color-sidebar)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        glow: '0 0 20px rgba(249, 115, 22, 0.15)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
