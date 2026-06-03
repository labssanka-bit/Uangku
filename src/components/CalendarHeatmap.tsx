import { useMemo, useState } from 'react'
import { startOfMonth, getDaysInMonth, getDay } from 'date-fns'
import { Card } from './ui/Card'
import { Amount } from './ui/Amount'
import { TransactionItem } from './TransactionItem'
import { formatRupiahRingkas } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { Transaction } from '@/types'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/**
 * Kalender bulanan dgn heatmap pengeluaran harian.
 * Makin tinggi pengeluaran → makin pekat (wine). Tanggal tertinggi diberi border.
 * Tap tanggal → tampil transaksi hari itu.
 */
export function CalendarHeatmap({ refDate, transactions }: { refDate: Date; transactions: Transaction[] }) {
  const [selected, setSelected] = useState<number | null>(null)

  const { perDay, max, daysInMonth, leadOffset } = useMemo(() => {
    const perDay = new Map<number, number>()
    for (const t of transactions) {
      if (t.type !== 'expense') continue
      const d = new Date(t.date).getDate()
      perDay.set(d, (perDay.get(d) ?? 0) + t.amount)
    }
    const max = Math.max(1, ...perDay.values())
    return {
      perDay,
      max,
      daysInMonth: getDaysInMonth(refDate),
      leadOffset: getDay(startOfMonth(refDate)), // 0=Minggu
    }
  }, [transactions, refDate])

  const maxDay = useMemo(() => {
    let day = 0
    let val = 0
    perDay.forEach((v, d) => {
      if (v > val) {
        val = v
        day = d
      }
    })
    return { day, val }
  }, [perDay])

  // Transaksi hari terpilih
  const dayTx = useMemo(() => {
    if (selected == null) return []
    return transactions.filter((t) => new Date(t.date).getDate() === selected)
  }, [selected, transactions])

  function intensity(day: number): string {
    const v = perDay.get(day) ?? 0
    if (v === 0) return 'bg-gray-100 dark:bg-gray-800 text-gray-400'
    const ratio = v / max
    if (ratio > 0.75) return 'bg-wine-600 text-white'
    if (ratio > 0.5) return 'bg-wine-500 text-white'
    if (ratio > 0.25) return 'bg-wine-500/60 text-white'
    return 'bg-wine-500/25 text-wine-700 dark:text-wine-100'
  }

  return (
    <Card className="mb-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Kalender Pengeluaran</h2>
        {maxDay.day > 0 && (
          <span className="text-xs text-gray-400">
            Tertinggi: tgl {maxDay.day} · {formatRupiahRingkas(maxDay.val)}
          </span>
        )}
      </div>

      {/* Header hari */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400">
        {HARI.map((h) => (
          <div key={h}>{h}</div>
        ))}
      </div>

      {/* Sel tanggal */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadOffset }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isMax = day === maxDay.day && maxDay.val > 0
          return (
            <button
              key={day}
              onClick={() => setSelected(selected === day ? null : day)}
              className={clsx(
                'flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition',
                intensity(day),
                isMax && 'ring-2 ring-maroon-700',
                selected === day && 'ring-2 ring-offset-1 ring-maroon-600 dark:ring-offset-gray-900'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Detail hari terpilih */}
      {selected != null && (
        <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">Tanggal {selected}</span>
            <Amount value={-(perDay.get(selected) ?? 0)} className="text-xs font-semibold text-gray-500" />
          </div>
          {dayTx.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">Tak ada transaksi.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {dayTx.map((t) => (
                <TransactionItem key={t.id} tx={t} showDate={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
