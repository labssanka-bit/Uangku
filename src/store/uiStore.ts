import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Dark mode
  dark: boolean
  toggleDark: () => void

  // Privacy mode — sembunyikan semua angka
  privacy: boolean
  togglePrivacy: () => void

  // Bulan aktif (ISO string tanggal-1 bulan terpilih) — disimpan string agar serializable
  activeMonthISO: string
  setActiveMonth: (iso: string) => void
}

const firstOfThisMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      dark: false,
      toggleDark: () => set((s) => ({ dark: !s.dark })),

      privacy: false,
      togglePrivacy: () => set((s) => ({ privacy: !s.privacy })),

      activeMonthISO: firstOfThisMonth(),
      setActiveMonth: (iso) => set({ activeMonthISO: iso }),
    }),
    {
      name: 'uangku-ui',
      // activeMonth tidak ikut dipersist agar selalu mulai dari bulan berjalan
      partialize: (s) => ({ dark: s.dark, privacy: s.privacy }),
    }
  )
)
