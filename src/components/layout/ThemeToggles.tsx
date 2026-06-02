import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

/** Toggle dark mode (bulan/matahari) + privacy (mata) untuk pojok kanan atas. */
export function ThemeToggles() {
  const { dark, toggleDark, privacy, togglePrivacy } = useUIStore()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePrivacy}
        aria-label={privacy ? 'Tampilkan angka' : 'Sembunyikan angka'}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-600 shadow-card dark:bg-gray-800/70 dark:text-gray-300"
      >
        {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      <button
        onClick={toggleDark}
        aria-label={dark ? 'Mode terang' : 'Mode gelap'}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-600 shadow-card dark:bg-gray-800/70 dark:text-gray-300"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  )
}
