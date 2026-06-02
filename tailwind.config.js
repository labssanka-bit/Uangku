/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === Palet UangKu: Maroon + Dusty Pink (profesional & hangat) ===
        // Maroon — brand utama (saldo, tombol, navigasi)
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
        // Dusty pink — aksen lembut (insight, highlight, background hangat)
        dusty: {
          50: '#FCF4F6',
          100: '#F8E8ED',
          200: '#F0D2DB',
          300: '#E4B3C1',
          400: '#D592A4',
          500: '#C57489',
          600: '#B05A72',
        },
        // Sage — pemasukan (+) : hijau muted yang serasi dengan maroon
        sage: {
          50: '#F0F7F4',
          100: '#DCEDE5',
          500: '#4E9079',
          600: '#3E7A66',
          700: '#335F50',
        },
        // Wine — pengeluaran (−) : maroon-rose, beda dari brand
        wine: {
          50: '#FBEFF1',
          100: '#F6DBDF',
          500: '#C04A5E',
          600: '#A93B50',
          700: '#8E3043',
        },
        // Alias semantik
        brand: {
          income: '#3E7A66', // sage
          expense: '#C04A5E', // wine
          accent: '#B05A72', // dusty
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(0,0,0,0.12)',
        card: '0 2px 16px -6px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
