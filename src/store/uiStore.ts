import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TxType } from '@/types'

/** Prefill untuk sheet tambah cepat (quick-add chips). */
export interface AddPreset {
  type?: TxType
  category_id?: string | null
  note?: string | null
}

interface UIState {
  // Dark mode
  dark: boolean
  toggleDark: () => void

  // Tema warna (lihat THEMES di lib/themes)
  theme: string
  setTheme: (id: string) => void

  // Privacy mode — sembunyikan semua angka
  privacy: boolean
  togglePrivacy: () => void

  // Bulan aktif (ISO string tanggal-1 bulan terpilih) — disimpan string agar serializable
  activeMonthISO: string
  setActiveMonth: (iso: string) => void

  // "Semua Data" — akumulasi lintas bulan/tahun (abaikan filter bulan)
  allTime: boolean
  setAllTime: (v: boolean) => void

  // Sheet tambah transaksi (global, agar bisa dibuka dari mana saja + prefill)
  addOpen: boolean
  addPreset: AddPreset | null
  openAdd: (preset?: AddPreset) => void
  closeAdd: () => void
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

      theme: 'maroon',
      setTheme: (id) => set({ theme: id }),

      privacy: false,
      togglePrivacy: () => set((s) => ({ privacy: !s.privacy })),

      activeMonthISO: firstOfThisMonth(),
      setActiveMonth: (iso) => set({ activeMonthISO: iso, allTime: false }),

      allTime: false,
      setAllTime: (v) => set({ allTime: v }),

      addOpen: false,
      addPreset: null,
      openAdd: (preset) => set({ addOpen: true, addPreset: preset ?? null }),
      closeAdd: () => set({ addOpen: false, addPreset: null }),
    }),
    {
      name: 'uangku-ui',
      // activeMonth tidak ikut dipersist agar selalu mulai dari bulan berjalan
      partialize: (s) => ({ dark: s.dark, privacy: s.privacy, theme: s.theme }),
    }
  )
)
