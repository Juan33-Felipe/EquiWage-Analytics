/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9FAFB',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FDBA74',
        },
        danger: '#EF4444',
        success: '#10B981',
        content: {
          main: '#111827',
          muted: '#6B7280',
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
