import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { formatBulanTahun } from '@/lib/format'
import { bulanBerikut, bulanSebelum } from '@/lib/dateRange'

/** Selector bulan: panah kiri/kanan + label. Sinkron via uiStore. */
export function MonthSelector({ className }: { className?: string }) {
  const iso = useUIStore((s) => s.activeMonthISO)
  const setMonth = useUIStore((s) => s.setActiveMonth)
  const ref = new Date(iso)

  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ''}`}>
      <button
        onClick={() => setMonth(bulanSebelum(ref).toISOString())}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card active:scale-95 dark:bg-gray-900 dark:text-gray-300"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="min-w-[140px] text-center text-sm font-semibold capitalize">
        {formatBulanTahun(ref)}
      </span>
      <button
        onClick={() => setMonth(bulanBerikut(ref).toISOString())}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card active:scale-95 dark:bg-gray-900 dark:text-gray-300"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
