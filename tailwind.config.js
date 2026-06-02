/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palet utama aplikasi
        brand: {
          income: '#10b981', // emerald — pemasukan / saldo
          expense: '#f87171', // merah lembut — pengeluaran
          accent: '#6366f1', // indigo — aksen & insight
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
