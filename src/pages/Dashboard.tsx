import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Eye, EyeOff, Wallet, PiggyBank, Repeat, Tags, Settings as Cog,
  ArrowDownLeft, ArrowUpRight, Zap, Plus, Flame, Landmark, HandCoins, Gem,
  BarChart3, TrendingUp, TrendingDown, ShieldCheck, Coins, ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MonthSelector } from '@/components/MonthSelector'
import { MonitoringChart } from '@/components/MonitoringChart'
import { ThemeToggles } from '@/components/layout/ThemeToggles'
import { TransactionItem } from '@/components/TransactionItem'
import { useUIStore } from '@/store/uiStore'
import { useProfile } from '@/hooks/useProfile'
import { useTransactions, useRecentTransactions, useTransactionDates } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import { useWalletBalances } from '@/hooks/useWallets'
import { buildPeriode, bulanSebelum, sisaHari } from '@/lib/dateRange'
import { summarize, buildInsight, buildComparison, txFlow } from '@/lib/summary'
import { buildQuickChips } from '@/lib/quickadd'
import { computeStreak } from '@/lib/streak'
import { formatRupiah, formatRupiahRingkas } from '@/lib/format'
import { clsx } from '@/lib/clsx'

export function Dashboard() {
  const iso = useUIStore((s) => s.activeMonthISO)
  const privacy = useUIStore((s) => s.privacy)
  const togglePrivacy = useUIStore((s) => s.togglePrivacy)
  const openAdd = useUIStore((s) => s.openAdd)
  const ref = new Date(iso)
  const periode = useMemo(() => buildPeriode(ref), [iso]) // eslint-disable-line react-hooks/exhaustive-deps
  const prevPeriode = useMemo(() => buildPeriode(bulanSebelum(ref)), [iso]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: profile } = useProfile()
  const { data: txs = [] } = useTransactions(periode)
  const { data: prevTxs = [] } = useTransactions(prevPeriode)
  const { data: recent = [] } = useRecentTransactions(5)
  const { data: recentMany = [] } = useRecentTransactions(50)
  const { data: budgets = [] } = useBudgets(periode)
  const { data: txDates = [] } = useTransactionDates()
  const { cashflowTotal, savingTotal } = useWalletBalances()

  const streak = useMemo(() => computeStreak(txDates), [txDates])
  const balance = cashflowTotal

  const summary = useMemo(() => summarize(txs, ref), [txs]) // eslint-disable-line react-hooks/exhaustive-deps
  const insight = useMemo(() => buildInsight(summary, balance, ref), [summary, balance]) // eslint-disable-line react-hooks/exhaustive-deps

  const comparison = useMemo(() => {
    const prevExpense = prevTxs.reduce((a, t) => a + txFlow(t).expense, 0)
    return buildComparison(summary.expense, prevExpense)
  }, [prevTxs, summary.expense])

  const quickChips = useMemo(() => buildQuickChips(recentMany, 4), [recentMany])

  const spentByCat = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txs) {
      if (t.type === 'expense' && t.category_id)
        m.set(t.category_id, (m.get(t.category_id) ?? 0) + t.amount)
    }
    return m
  }, [txs])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const net = summary.net
  const sisa = sisaHari(ref)
  const amanHari = balance > 0 && sisa > 0 ? balance / sisa : 0
  const savingsPct = summary.savingsRatio

  return (
    <div className="px-4 pt-5">
      {/* Header sapaan + toggles */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Hai{firstName ? `, ${firstName}` : ''}! 👋</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm capitalize text-gray-400">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p>
            {streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-500/15">
                <Flame size={12} /> {streak} hari
              </span>
            )}
          </div>
        </div>
        <ThemeToggles />
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
      <div className="contents lg:col-span-2 lg:block">

      {/* Kartu saldo gradient */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-700 to-maroon-900 p-5 text-white shadow-soft">
          {/* aksen dekoratif */}
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-sm/none opacity-90">Total Saldo</span>
            <button onClick={togglePrivacy} aria-label="Sembunyikan saldo" className="rounded-full bg-white/10 p-1.5 opacity-90 active:scale-90">
              {privacy ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <CountUp value={balance} blur={privacy} className="relative mt-1 block text-3xl font-extrabold" />
          <div className="relative mt-1 flex items-center gap-1 text-xs opacity-90">
            {net >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>Bulan ini {net >= 0 ? 'surplus' : 'defisit'} </span>
            <span className={clsx('nums font-semibold', privacy && 'privacy-blur')}>{formatRupiah(Math.abs(net))}</span>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <span className="flex items-center gap-1 text-xs opacity-90"><ArrowDownLeft size={14} /> Pemasukan</span>
              <p className={clsx('nums mt-0.5 font-bold', privacy && 'privacy-blur')}>{formatRupiah(summary.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <span className="flex items-center gap-1 text-xs opacity-90"><ArrowUpRight size={14} /> Pengeluaran</span>
              <p className={clsx('nums mt-0.5 font-bold', privacy && 'privacy-blur')}>{formatRupiah(summary.expense)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strip statistik cepat */}
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile icon={ShieldCheck} tint="#7B2540" label="Aman / hari" value={formatRupiahRingkas(amanHari)} blur={privacy} />
        <StatTile icon={TrendingDown} tint="#B23A48" label="Rata² keluar/hari" value={formatRupiahRingkas(summary.avgPerDay)} blur={privacy} />
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900">
          <div className="relative shrink-0">
            <Ring pct={savingsPct} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-sage-700 dark:text-sage-500">{Math.round(savingsPct * 100)}%</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Nabung</p>
            <p className="truncate text-[10px] text-gray-400">dari pemasukan</p>
          </div>
        </div>
        <StatTile icon={Coins} tint="#3E7A66" label="Transaksi bln ini" value={String(summary.count)} />
      </div>

      {/* Ringkasan dompet per grup */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Link to="/dompet" className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card active:scale-[.98] dark:bg-gray-900">
          <div>
            <span className="flex items-center gap-1 text-xs font-medium text-maroon-700 dark:text-dusty-300"><Landmark size={13} /> Cashflow</span>
            <p className={clsx('nums mt-0.5 font-bold', privacy && 'privacy-blur')}>{formatRupiah(cashflowTotal)}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
        <Link to="/dompet?aksi=nabung" className="rounded-2xl bg-white p-3 shadow-card active:scale-[.98] dark:bg-gray-900">
          <span className="flex items-center justify-between text-xs font-medium text-sage-700">
            <span className="flex items-center gap-1"><PiggyBank size={13} /> Saving</span>
            <span className="flex items-center gap-0.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-semibold text-sage-700 dark:bg-sage-500/20"><Plus size={10} /> Nabung</span>
          </span>
          <p className={clsx('nums mt-0.5 font-bold', privacy && 'privacy-blur')}>{formatRupiah(savingTotal)}</p>
        </Link>
      </div>

      {/* Selector bulan */}
      <MonthSelector className="my-4" />

      {/* Kartu insight */}
      <div className="mb-4 rounded-2xl bg-dusty-100 p-4 dark:bg-dusty-500/10">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 shrink-0 text-dusty-600" size={20} />
          <p className="text-sm leading-relaxed text-maroon-800 dark:text-dusty-200">{insight}</p>
        </div>
        {comparison && (
          <p className="mt-2 border-t border-dusty-200/60 pt-2 text-xs leading-relaxed text-maroon-700 dark:border-dusty-500/20 dark:text-dusty-300">
            {comparison}
          </p>
        )}
      </div>

      {/* Pengeluaran per kategori (interaktif) */}
      {summary.byCategory.length > 0 && (
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Pengeluaran per Kategori</h2>
            <Link to="/statistik" className="text-xs font-semibold text-maroon-700">Detail</Link>
          </div>
          <div className="space-y-3">
            {summary.byCategory.slice(0, 5).map((c) => (
              <Link key={c.id} to="/statistik" className="block active:opacity-70">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span className={clsx('nums text-xs text-gray-500', privacy && 'privacy-blur')}>{formatRupiah(c.total)}</span>
                  <span className="nums w-9 text-right text-[11px] font-semibold text-gray-400">{Math.round(c.pct * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${Math.max(3, Math.min(100, c.pct * 100))}%`, backgroundColor: c.color }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Grafik pemantauan arus 6 bulan */}
      <MonitoringChart refDate={ref} />

      {/* Catat cepat */}
      {quickChips.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-gray-500">
            <Zap size={14} className="text-dusty-600" /> Catat Cepat
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickChips.map((c, i) => (
              <button
                key={i}
                onClick={() => openAdd({ type: c.type, category_id: c.category_id, note: c.note })}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white py-2 pl-2 pr-3 shadow-card active:scale-95 dark:bg-gray-900"
              >
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="text-sm font-medium">{c.label}</span>
              </button>
            ))}
            <button
              onClick={() => openAdd()}
              className="flex shrink-0 items-center gap-1 rounded-full bg-maroon-700 px-4 py-2 text-sm font-semibold text-white shadow-card active:scale-95"
            >
              <Plus size={16} /> Lainnya
            </button>
          </div>
        </div>
      )}

      {/* Menu cepat */}
      <div className="mb-4 grid grid-cols-4 gap-y-3 gap-x-2">
        <QuickMenu to="/dompet" icon={Landmark} label="Dompet" />
        <QuickMenu to="/hutang" icon={HandCoins} label="Hutang" />
        <QuickMenu to="/aset" icon={Gem} label="Aset" />
        <QuickMenu to="/anggaran" icon={PiggyBank} label="Anggaran" />
        <QuickMenu to="/berulang" icon={Repeat} label="Berulang" />
        <QuickMenu to="/kategori" icon={Tags} label="Kategori" />
        <QuickMenu to="/statistik" icon={BarChart3} label="Statistik" />
        <QuickMenu to="/setting" icon={Cog} label="Setting" />
      </div>

      </div>{/* /kolom utama */}
      <div className="contents lg:col-span-1 lg:block">

      {/* Ringkasan anggaran */}
      {budgets.length > 0 && (
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Ringkasan Anggaran</h2>
            <Link to="/anggaran" className="text-xs font-semibold text-maroon-700">Lihat semua</Link>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 4).map((b) => {
              const spent = spentByCat.get(b.category_id) ?? 0
              const ratio = b.amount > 0 ? spent / b.amount : 0
              return (
                <div key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={b.category?.icon} color={b.category?.color} size="sm" />
                      {b.category?.name}
                    </span>
                    <span className={clsx('nums text-xs text-gray-500', privacy && 'privacy-blur')}>
                      {formatRupiah(spent)} / {formatRupiah(b.amount)}
                    </span>
                  </div>
                  <ProgressBar ratio={ratio} />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Transaksi terakhir */}
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-bold">Transaksi Terakhir</h2>
          <Link to="/transaksi" className="text-xs font-semibold text-maroon-700">Lihat semua</Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Wallet size={26} className="text-gray-300" />
            <p className="text-sm text-gray-400">Belum ada transaksi.</p>
            <button onClick={() => openAdd()} className="rounded-full bg-maroon-700 px-4 py-2 text-xs font-bold text-white active:scale-95">+ Catat pertama</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recent.map((t) => (
              <TransactionItem key={t.id} tx={t} />
            ))}
          </div>
        )}
      </Card>

      </div>{/* /rail kanan */}
      </div>{/* /grid */}
    </div>
  )
}

/** Angka yang menghitung naik saat muncul. */
function CountUp({ value, className, blur }: { value: number; className?: string; blur?: boolean }) {
  const [n, setN] = useState(value)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const dur = 700
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      setN(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={clsx('nums', blur && 'privacy-blur', className)}>{formatRupiah(Math.round(n))}</span>
}

/** Cincin progres kecil (rasio nabung). */
function Ring({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, Math.max(0, pct)))
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} className="stroke-gray-200 dark:stroke-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} strokeLinecap="round" className="stroke-sage-500" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s ease' }} />
    </svg>
  )
}

function StatTile({ icon: Icon, label, value, tint, blur }: { icon: typeof Wallet; label: string; value: string; tint: string; blur?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: tint + '1f', color: tint }}>
        <Icon size={16} />
      </span>
      <p className={clsx('nums mt-2 text-sm font-extrabold', blur && 'privacy-blur')}>{value}</p>
      <p className="truncate text-[10px] text-gray-400">{label}</p>
    </div>
  )
}

function QuickMenu({ to, icon: Icon, label }: { to: string; icon: typeof Wallet; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5">
      <span className="flex h-14 w-full items-center justify-center rounded-2xl bg-white text-maroon-700 shadow-card active:scale-95 dark:bg-gray-900 dark:text-dusty-300">
        <Icon size={22} />
      </span>
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
    </Link>
  )
}
