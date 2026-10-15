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
        }
      },
      boxShadow: {
        soft: '0px 10px 30px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        xl: '24px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
