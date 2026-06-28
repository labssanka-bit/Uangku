import { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Card } from './ui/Card'
import { useTransactionsBetween } from '@/hooks/useTransactions'
import { isTransfer } from '@/lib/summary'
import { formatRupiah, formatRupiahRingkas, toISODate } from '@/lib/format'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

/** Grafik area pemasukan vs pengeluaran 6 bulan terakhir (smooth). */
export function MonitoringChart({ refDate }: { refDate: Date }) {
  const range = useMemo(() => {
    const start = startOfMonth(subMonths(refDate, 5))
    const end = endOfMonth(refDate)
    return { start: toISODate(start), end: toISODate(end) }
  }, [refDate])

  const { data: txs = [] } = useTransactionsBetween(range.start, range.end)

  const data = useMemo(() => {
    const buckets: Record<string, { label: string; masuk: number; keluar: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(refDate, i)
      buckets[format(d, 'yyyy-MM')] = { label: format(d, 'MMM', { locale: localeId }), masuk: 0, keluar: 0 }
    }
    for (const t of txs) {
      if (isTransfer(t)) continue
      const key = t.date.slice(0, 7)
      if (!buckets[key]) continue
      if (t.type === 'income') buckets[key].masuk += t.amount
      else buckets[key].keluar += t.amount
    }
    return Object.values(buckets)
  }, [txs, refDate])

  const kosong = data.every((d) => d.masuk === 0 && d.keluar === 0)

  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Pemantauan Arus</h2>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-gray-500">
            <span className="h-2 w-2 rounded-full bg-sage-500" /> Pemasukan
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="h-2 w-2 rounded-full bg-wine-500" /> Pengeluaran
          </span>
        </div>
      </div>

      {kosong ? (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada data 6 bulan terakhir.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 6, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => formatRupiahRingkas(v).replace('Rp ', '')}
              tick={{ fontSize: 10 }} width={46} axisLine={false} tickLine={false}
            />
            <Tooltip
              formatter={(v: number, name) => [formatRupiah(v), name === 'masuk' ? 'Pemasukan' : 'Pengeluaran']}
              labelStyle={{ fontWeight: 600 }}
              contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
            <Area type="monotone" dataKey="masuk" stroke="#0D9488" strokeWidth={2.5} fill="url(#gMasuk)" />
            <Area type="monotone" dataKey="keluar" stroke="#E11D48" strokeWidth={2.5} strokeDasharray="5 4" fill="url(#gKeluar)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
