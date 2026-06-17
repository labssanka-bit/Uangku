/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === Palet UangKu v2: Vibrant Violet + Teal + Coral ===
        // maroon alias tetap dipakai di kode — sekarang = vibrant violet
        maroon: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // dusty alias = soft lavender/lilac
        dusty: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        // sage = bright teal — pemasukan (+)
        sage: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        // wine = coral/rose — pengeluaran (−)
        wine: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        brand: {
          income:  '#0D9488',
          expense: '#F43F5E',
          accent:  '#9333EA',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Neumorphic — nilai diambil dari CSS variable (adaptive light/dark)
        nm:       'var(--nm-shadow)',
        'nm-sm':  'var(--nm-shadow-sm)',
        'nm-inset': 'var(--nm-shadow-inset)',
        // Legacy
        soft:  '0 4px 24px -8px rgba(109, 40, 217, 0.28)',
        card:  'var(--nm-shadow-sm)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
