/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === Palet UangKu: Maroon + Dusty Pink (profesional & hangat) ===
        maroon: {
          50: '#FBF1F3',
          100: '#F6E0E5',
          200: '#EAC0CB',
          300: '#D998A8',
          400: '#C06B80',
          500: '#A14559',
          600: '#8A3447',
          700: '#72283A',
          800: '#5A1E2E',
          900: '#4A1924',
        },
        // Dusty pink — aksen lembut
        dusty: {
          50: '#FCF4F6',
          100: '#F8E8ED',
          200: '#F0D2DB',
          300: '#E4B3C1',
          400: '#D592A4',
          500: '#C57489',
          600: '#B05A72',
        },
        // Sage — pemasukan (+)
        sage: {
          50: '#F0F7F4',
          100: '#DCEDE5',
          500: '#4E9079',
          600: '#3E7A66',
          700: '#335F50',
        },
        // Wine — pengeluaran (−)
        wine: {
          50: '#FBEFF1',
          100: '#F6DBDF',
          500: '#C04A5E',
          600: '#A93B50',
          700: '#8E3043',
        },
        brand: {
          income: '#3E7A66',
          expense: '#C04A5E',
          accent: '#B05A72',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Neumorphic — adaptive light/dark via CSS variable
        nm: 'var(--nm-shadow)',
        'nm-sm': 'var(--nm-shadow-sm)',
        'nm-inset': 'var(--nm-shadow-inset)',
        // Legacy
        soft: '0 4px 24px -8px rgba(114, 40, 58, 0.28)',
        card: 'var(--nm-shadow-sm)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
