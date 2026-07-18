import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { formatBulanTahun } from '@/lib/format'
import { bulanBerikut, bulanSebelum } from '@/lib/dateRange'
import { Sheet } from './ui/Sheet'
import { clsx } from '@/lib/clsx'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Selector bulan: panah + label yang bisa diketuk → picker bulan/tahun (lompat langsung). */
export function MonthSelector({ className, hideAllTime = false }: { className?: string; hideAllTime?: boolean }) {
  const iso = useUIStore((s) => s.activeMonthISO)
  const setMonth = useUIStore((s) => s.setActiveMonth)
  const allTime = useUIStore((s) => s.allTime)
  const setAllTime = useUIStore((s) => s.setAllTime)
  const ref = new Date(iso)
  const showingAll = allTime && !hideAllTime

  const [open, setOpen] = useState(false)
  const [pickYear, setPickYear] = useState(ref.getFullYear())
  const [view, setView] = useState<'bulan' | 'tahun'>('bulan')
  const [yearStart, setYearStart] = useState(ref.getFullYear() - 6) // awal grid 12 tahun

  const now = new Date()
  // Pakai tanggal 15 agar bebas dari pergeseran zona waktu saat toISOString
  const jump = (year: number, monthIdx: number) => {
    setMonth(new Date(year, monthIdx, 15).toISOString())
    setOpen(false)
  }

  function openPicker() {
    setPickYear(ref.getFullYear())
    setYearStart(ref.getFullYear() - 6)
    setView('bulan')
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
          className={clsx('min-w-[140px] rounded-full px-3 py-1.5 text-center text-sm font-semibold capitalize active:scale-95', showingAll && 'text-maroon-700 dark:text-dusty-200')}
        >
          {showingAll ? '📊 Semua Data' : formatBulanTahun(ref)}
        </button>
        <button
          onClick={() => setMonth(bulanBerikut(ref).toISOString())}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card active:scale-95 dark:bg-gray-900 dark:text-gray-300"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={view === 'bulan' ? 'Pilih Bulan' : 'Pilih Tahun'}>
        {/* Header: panah + label (label tahun bisa diketuk → mode pilih tahun) */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={() => (view === 'bulan' ? setPickYear((y) => y - 1) : setYearStart((s) => s - 12))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
            aria-label="Sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>
          {view === 'bulan' ? (
            <button
              onClick={() => { setYearStart(pickYear - 6); setView('tahun') }}
              className="nums w-28 rounded-full py-1 text-center text-xl font-extrabold text-maroon-700 active:scale-95 dark:text-dusty-200"
            >
              {pickYear} ▾
            </button>
          ) : (
            <span className="nums w-28 text-center text-base font-bold text-maroon-700 dark:text-dusty-200">
              {yearStart}–{yearStart + 11}
            </span>
          )}
          <button
            onClick={() => (view === 'bulan' ? setPickYear((y) => y + 1) : setYearStart((s) => s + 12))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:scale-95 dark:bg-gray-800"
            aria-label="Berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {view === 'bulan' ? (
          /* Grid 12 bulan */
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
        ) : (
          /* Grid 12 tahun → pilih → kembali ke grid bulan */
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const y = yearStart + i
              const isActive = ref.getFullYear() === y
              const isNow = now.getFullYear() === y
              return (
                <button
                  key={y}
                  onClick={() => { setPickYear(y); setView('bulan') }}
                  className={clsx(
                    'nums rounded-2xl py-3 text-sm font-semibold transition active:scale-95',
                    isActive
                      ? 'bg-maroon-700 text-white shadow-soft'
                      : isNow
                        ? 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/15 dark:text-dusty-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        )}

        {/* Semua Data — akumulasi lintas bulan/tahun */}
        {!hideAllTime && (
          <button
            onClick={() => { setAllTime(true); setOpen(false) }}
            className={clsx('mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold active:scale-95',
              allTime ? 'bg-maroon-700 text-white shadow-soft' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300')}
          >
            📊 Semua Data (akumulasi lintas bulan &amp; tahun)
          </button>
        )}

        {/* Lompat ke bulan ini */}
        <button
          onClick={() => jump(now.getFullYear(), now.getMonth())}
          className="mt-2 w-full rounded-2xl bg-dusty-100 py-2.5 text-sm font-semibold text-maroon-700 active:scale-95 dark:bg-dusty-500/10 dark:text-dusty-200"
        >
          Ke bulan ini
        </button>
      </Sheet>
    </>
  )
}
