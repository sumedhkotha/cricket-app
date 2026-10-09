/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0B4D3B',
          dark: '#08382B',
          light: '#116B52',
          hero1: '#0F4A30',
          hero2: '#0B3D2B',
        },
        gold: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
        },
        navy: {
          DEFAULT: '#0B1B3A',
          dark: '#060F22',
          light: '#1C2E54',
        },
        surface: {
          bg: '#F8FAFB',
          card: '#FFFFFF',
          border: '#E5E9EC',
        },
        status: {
          greenBg: '#D1FAE5',
          greenText: '#065F46',
          amberBg: '#FEF3C7',
          amberText: '#92400E',
          orangeBg: '#FFEDD5',
          orangeText: '#C2410C',
          greyBg: '#F1F5F9',
          greyText: '#475569',
        }
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '18px',
        'pill': '9999px',
        'input': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(11, 27, 58, 0.05), 0 2px 6px -1px rgba(11, 27, 58, 0.02)',
        'elevated': '0 10px 30px -4px rgba(11, 27, 58, 0.08), 0 4px 12px -2px rgba(11, 27, 58, 0.04)',
      }
    },
  },
  plugins: [],
}
