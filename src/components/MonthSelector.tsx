import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { formatBulanTahun } from '@/lib/format'
import { bulanBerikut, bulanSebelum } from '@/lib/dateRange'
import { Sheet } from './ui/Sheet'
import { clsx } from '@/lib/clsx'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Selector bulan: panah + label yang bisa diketuk → picker bulan/tahun (lompat langsung). */
export function MonthSelector({ className }: { className?: string }) {
  const iso = useUIStore((s) => s.activeMonthISO)
  const setMonth = useUIStore((s) => s.setActiveMonth)
  const ref = new Date(iso)

  const [open, setOpen] = useState(false)
  const [pickYear, setPickYear] = useState(ref.getFullYear())

  const now = new Date()
  // Pakai tanggal 15 agar bebas dari pergeseran zona waktu saat toISOString
  const jump = (year: number, monthIdx: number) => {
    setMonth(new Date(year, monthIdx, 15).toISOString())
    setOpen(false)
  }

  function openPicker() {
    setPickYear(ref.getFullYear())
    setOpen(true)
  }

  return (
    <>
      <div className={`flex items-center justify-center gap-2 ${className ?? ''}`}>
        <button
          onClick={() => setMonth(bulanSebelum(ref).toISOString())}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card active:scale-95 dark:bg-gray-900 dark:text-gray-300"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={openPicker}
          className="min-w-[140px] rounded-full px-3 py-1.5 text-center text-sm font-semibold capitalize active:scale-95"
        >
          {formatBulanTahun(ref)}
        </button>
        <button
          onClick={() => setMonth(bulanBerikut(ref).toISOString())}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card active:scale-95 dark:bg-gray-900 dark:text-gray-300"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Pilih Bulan">
        {/* Tahun: panah + label */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setPickYear((y) => y - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
            aria-label="Tahun sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="nums w-20 text-center text-xl font-extrabold text-maroon-700 dark:text-dusty-200">{pickYear}</span>
          <button
            onClick={() => setPickYear((y) => y + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
            aria-label="Tahun berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Grid 12 bulan */}
        <div className="grid grid-cols-3 gap-2">
          {BULAN.map((b, i) => {
            const isActive = ref.getFullYear() === pickYear && ref.getMonth() === i
            const isNow = now.getFullYear() === pickYear && now.getMonth() === i
            return (
              <button
                key={b}
                onClick={() => jump(pickYear, i)}
                className={clsx(
                  'rounded-2xl py-3 text-sm font-semibold transition active:scale-95',
                  isActive
                    ? 'bg-maroon-700 text-white shadow-soft'
                    : isNow
                      ? 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/15 dark:text-dusty-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {b}
              </button>
            )
          })}
        </div>

        {/* Lompat ke bulan ini */}
        <button
          onClick={() => jump(now.getFullYear(), now.getMonth())}
          className="mt-4 w-full rounded-2xl bg-dusty-100 py-2.5 text-sm font-semibold text-maroon-700 active:scale-95 dark:bg-dusty-500/10 dark:text-dusty-200"
        >
          Ke bulan ini
        </button>
      </Sheet>
    </>
  )
}
