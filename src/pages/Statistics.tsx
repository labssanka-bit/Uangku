import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet, PiggyBank, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Amount } from '@/components/ui/Amount'
import { MonthSelector } from '@/components/MonthSelector'
import { CalendarHeatmap } from '@/components/CalendarHeatmap'
import { useUIStore } from '@/store/uiStore'
import { useTransactions, useTransactionsBetween } from '@/hooks/useTransactions'
import { buildPeriode } from '@/lib/dateRange'
import { summarize, isTransfer } from '@/lib/summary'
import { formatRupiah, formatRupiahRingkas } from '@/lib/format'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toISODate } from '@/lib/format'
import { clsx } from '@/lib/clsx'

type Granularity = 'harian' | 'mingguan' | 'bulanan'

export function Statistics() {
  const iso = useUIStore((s) => s.activeMonthISO)
  const ref = new Date(iso)
  const periode = useMemo(() => buildPeriode(ref), [iso]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: txs = [] } = useTransactions(periode)
  const summary = useMemo(() => summarize(txs, ref), [txs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Rentang 6 bulan untuk tren
  const range = useMemo(() => {
    const start = startOfMonth(subMonths(ref, 5))
    const end = endOfMonth(ref)
    return { start: toISODate(start), end: toISODate(end) }
  }, [iso]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: rangeTxs = [] } = useTransactionsBetween(range.start, range.end)

  // Data bar 6 bulan: masuk vs keluar
  const trend6 = useMemo(() => {
    const buckets: Record<string, { label: string; masuk: number; keluar: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(ref, i)
      const key = format(d, 'yyyy-MM')
      buckets[key] = { label: format(d, 'MMM', { locale: localeId }), masuk: 0, keluar: 0 }
    }
    for (const t of rangeTxs) {
      if (isTransfer(t)) continue
      const key = t.date.slice(0, 7)
      if (!buckets[key]) continue
      if (t.type === 'income') buckets[key].masuk += t.amount
      else buckets[key].keluar += t.amount
    }
    return Object.values(buckets)
  }, [rangeTxs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tren per kategori (line) berdasarkan granularity, bulan aktif
  const [gran, setGran] = useState<Granularity>('harian')
  const catTrend = useMemo(() => buildCategoryTrend(txs, gran), [txs, gran])

  const net = summary.net

  return (
    <div className="px-4 pt-5">
      <h1 className="mb-3 text-xl font-extrabold">Statistik</h1>
      <MonthSelector className="mb-4" />

      {/* Kartu pengeluaran & pemasukan */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Card className="bg-wine-50 dark:bg-wine-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-wine-500">
            <TrendingDown size={14} /> Pengeluaran
          </span>
          <Amount value={summary.expense} className="mt-1 block text-lg font-extrabold text-wine-600" />
          <span className="text-[11px] text-gray-400">{txs.filter((t) => t.type === 'expense' && !isTransfer(t)).length} transaksi</span>
        </Card>
        <Card className="bg-sage-50 dark:bg-sage-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-sage-600">
            <TrendingUp size={14} /> Pemasukan
          </span>
          <Amount value={summary.income} className="mt-1 block text-lg font-extrabold text-sage-600" />
          <span className="text-[11px] text-gray-400">{txs.filter((t) => t.type === 'income' && !isTransfer(t)).length} transaksi</span>
        </Card>
      </div>

      {/* 3 metrik kecil */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Metric icon={Calendar} label="Rata-rata/Hari" value={formatRupiahRingkas(summary.avgPerDay)} />
        <Metric icon={Wallet} label="Transaksi Terbesar" value={formatRupiahRingkas(summary.largest?.amount ?? 0)} />
        <Metric icon={PiggyBank} label="Rasio Nabung" value={`${Math.round(summary.savingsRatio * 100)}%`} />
      </div>

      {/* Arus kas bersih */}
      <Card className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Arus Kas Bersih</h2>
          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', net >= 0 ? 'bg-sage-100 text-sage-700 dark:bg-sage-500/20' : 'bg-wine-100 text-wine-600 dark:bg-wine-500/20')}>
            {net >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>
        <CashFlowBar income={summary.income} expense={summary.expense} />
        <Amount value={net} className="mt-2 block text-lg font-extrabold" />
      </Card>

      {/* Kalender heatmap pengeluaran */}
      <CalendarHeatmap refDate={ref} transactions={txs} />

      {/* Tren 6 bulan */}
      <Card className="mb-3">
        <h2 className="mb-3 font-bold">Tren 6 Bulan</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trend6} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatRupiahRingkas(v).replace('Rp ', '')} tick={{ fontSize: 10 }} width={44} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Bar dataKey="masuk" name="Masuk" fill="#3E7A66" radius={[4, 4, 0, 0]} />
            <Bar dataKey="keluar" name="Keluar" fill="#C04A5E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tren per kategori */}
      <Card className="mb-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Tren per Kategori</h2>
          <div className="flex rounded-xl bg-gray-100 p-0.5 text-xs dark:bg-gray-800">
            {(['harian', 'mingguan', 'bulanan'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGran(g)}
                className={clsx('rounded-lg px-2 py-1 capitalize', gran === g ? 'bg-white font-semibold shadow-card dark:bg-gray-700' : 'text-gray-500')}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={catTrend.rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatRupiahRingkas(v).replace('Rp ', '')} tick={{ fontSize: 10 }} width={44} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {catTrend.series.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 px-2 py-3 text-center">
      <Icon size={18} className="text-dusty-600" />
      <span className="nums text-sm font-bold">{value}</span>
      <span className="text-[10px] leading-tight text-gray-400">{label}</span>
    </Card>
  )
}

/** Bar horizontal hijau/merah proporsional. */
function CashFlowBar({ income, expense }: { income: number; expense: number }) {
  const total = income + expense || 1
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
      <div className="bg-sage-600" style={{ width: `${(income / total) * 100}%` }} />
      <div className="bg-wine-500" style={{ width: `${(expense / total) * 100}%` }} />
    </div>
  )
}

/** Susun data line chart: top-4 kategori pengeluaran per bucket waktu. */
function buildCategoryTrend(txs: import('@/types').Transaction[], gran: Granularity) {
  const expense = txs.filter((t) => t.type === 'expense' && !isTransfer(t))

  // Tentukan kunci bucket per transaksi
  const bucketKey = (dateStr: string) => {
    const d = new Date(dateStr)
    if (gran === 'bulanan') return format(d, 'MMM', { locale: localeId })
    if (gran === 'mingguan') return `Mg ${Math.ceil(d.getDate() / 7)}`
    return format(d, 'd/M')
  }

  // Total per kategori untuk pilih top 4
  const catTotals = new Map<string, { name: string; color: string }>()
  const totals = new Map<string, number>()
  for (const t of expense) {
    const cid = t.category_id ?? 'lain'
    totals.set(cid, (totals.get(cid) ?? 0) + t.amount)
    if (!catTotals.has(cid))
      catTotals.set(cid, { name: t.category?.name ?? 'Lainnya', color: t.category?.color ?? '#64748b' })
  }
  const top = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cid]) => cid)

  const series = top.map((cid) => ({
    key: cid,
    name: catTotals.get(cid)?.name ?? 'Lainnya',
    color: catTotals.get(cid)?.color ?? '#64748b',
  }))

  // Bucket -> row
  const rowMap = new Map<string, Record<string, number | string>>()
  for (const t of expense) {
    const cid = t.category_id ?? 'lain'
    if (!top.includes(cid)) continue
    const key = bucketKey(t.date)
    const row = rowMap.get(key) ?? { label: key }
    row[cid] = ((row[cid] as number) ?? 0) + t.amount
    rowMap.set(key, row)
  }
  const rows = Array.from(rowMap.values())
  return { rows, series }
}
