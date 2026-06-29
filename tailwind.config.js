/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === Brand (maroon) & accent (dusty) — DITEMA via CSS var (src/themes.css) ===
        // Nilai HSL channels per tema → dukung opacity modifier (/40 dst).
        maroon: {
          50: 'hsl(var(--m-50) / <alpha-value>)',
          100: 'hsl(var(--m-100) / <alpha-value>)',
          200: 'hsl(var(--m-200) / <alpha-value>)',
          300: 'hsl(var(--m-300) / <alpha-value>)',
          400: 'hsl(var(--m-400) / <alpha-value>)',
          500: 'hsl(var(--m-500) / <alpha-value>)',
          600: 'hsl(var(--m-600) / <alpha-value>)',
          700: 'hsl(var(--m-700) / <alpha-value>)',
          800: 'hsl(var(--m-800) / <alpha-value>)',
          900: 'hsl(var(--m-900) / <alpha-value>)',
        },
        dusty: {
          50: 'hsl(var(--d-50) / <alpha-value>)',
          100: 'hsl(var(--d-100) / <alpha-value>)',
          200: 'hsl(var(--d-200) / <alpha-value>)',
          300: 'hsl(var(--d-300) / <alpha-value>)',
          400: 'hsl(var(--d-400) / <alpha-value>)',
          500: 'hsl(var(--d-500) / <alpha-value>)',
          600: 'hsl(var(--d-600) / <alpha-value>)',
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
