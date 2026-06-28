import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, Wallet, PiggyBank, Repeat, Tags, Settings as Cog, ArrowDownLeft, ArrowUpRight, Zap, Plus, Flame, Landmark, HandCoins, Gem, BarChart3 } from 'lucide-react'
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
import { buildPeriode, bulanSebelum } from '@/lib/dateRange'
import { summarize, buildInsight, buildComparison, isTransfer } from '@/lib/summary'
import { buildQuickChips } from '@/lib/quickadd'
import { computeStreak } from '@/lib/streak'
import { formatRupiah } from '@/lib/format'

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

  // Total Saldo = uang yang bisa dipakai = Cashflow (TIDAK termasuk Saving).
  // cashflowTotal sudah termasuk transaksi tanpa dompet → Total Saldo == kartu Cashflow.
  const balance = cashflowTotal

  const summary = useMemo(() => summarize(txs, ref), [txs]) // eslint-disable-line react-hooks/exhaustive-deps
  const insight = useMemo(() => buildInsight(summary, balance, ref), [summary, balance]) // eslint-disable-line react-hooks/exhaustive-deps

  // Banding pengeluaran vs bulan lalu
  const comparison = useMemo(() => {
    const prevExpense = prevTxs.filter((t) => t.type === 'expense' && !isTransfer(t)).reduce((a, t) => a + t.amount, 0)
    return buildComparison(summary.expense, prevExpense)
  }, [prevTxs, summary.expense])

  // Saran quick-add dari transaksi tersering
  const quickChips = useMemo(() => buildQuickChips(recentMany, 4), [recentMany])

  // Pengeluaran per kategori untuk progress anggaran
  const spentByCat = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txs) {
      if (t.type === 'expense' && t.category_id)
        m.set(t.category_id, (m.get(t.category_id) ?? 0) + t.amount)
    }
    return m
  }, [txs])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="px-4 pt-5">
      {/* Header sapaan + toggles */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Hai{firstName ? `, ${firstName}` : ''}! 👋</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm capitalize text-gray-400">{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(ref)}</p>
            {streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-500/15">
                <Flame size={12} /> {streak} hari
              </span>
            )}
          </div>
        </div>
        <ThemeToggles />
      </div>

      {/* Desktop: 2 kolom (utama + rail kanan); mobile: 1 kolom mengalir */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
      <div className="contents lg:col-span-2 lg:block">

      {/* Kartu saldo gradient */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-700 to-maroon-900 p-5 text-white shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-sm/none opacity-90">Total Saldo</span>
            <button onClick={togglePrivacy} aria-label="Sembunyikan saldo" className="opacity-90">
              {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className={`nums mt-1 text-3xl font-extrabold ${privacy ? 'privacy-blur' : ''}`}>
            {formatRupiah(balance)}
          </p>

          {/* Ringkasan masuk/keluar bulan ini */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <span className="flex items-center gap-1 text-xs opacity-90">
                <ArrowDownLeft size={14} /> Pemasukan
              </span>
              <p className={`nums mt-0.5 font-bold ${privacy ? 'privacy-blur' : ''}`}>{formatRupiah(summary.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <span className="flex items-center gap-1 text-xs opacity-90">
                <ArrowUpRight size={14} /> Pengeluaran
              </span>
              <p className={`nums mt-0.5 font-bold ${privacy ? 'privacy-blur' : ''}`}>{formatRupiah(summary.expense)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ringkasan dompet per grup */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/dompet" className="rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900">
          <span className="flex items-center gap-1 text-xs font-medium text-maroon-700"><Landmark size={13} /> Cashflow</span>
          <p className={`nums mt-0.5 font-bold ${privacy ? 'privacy-blur' : ''}`}>{formatRupiah(cashflowTotal)}</p>
        </Link>
        {/* Tap Saving → langsung buka transfer "Nabung" (Cashflow → Saving) */}
        <Link to="/dompet?aksi=nabung" className="rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900">
          <span className="flex items-center justify-between text-xs font-medium text-sage-700">
            <span className="flex items-center gap-1"><PiggyBank size={13} /> Saving</span>
            <span className="flex items-center gap-0.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-semibold text-sage-700 dark:bg-sage-500/20"><Plus size={10} /> Nabung</span>
          </span>
          <p className={`nums mt-0.5 font-bold ${privacy ? 'privacy-blur' : ''}`}>{formatRupiah(savingTotal)}</p>
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

      {/* Grafik pemantauan arus 6 bulan */}
      <MonitoringChart refDate={ref} />

      {/* Quick-add: transaksi yang sering dicatat (1 tap) */}
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
            {/* Chip generik tambah */}
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
                    <span className="nums text-xs text-gray-500">
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
          <p className="py-6 text-center text-sm text-gray-400">Belum ada transaksi. Tap tombol + untuk menambah.</p>
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

function QuickMenu({ to, icon: Icon, label }: { to: string; icon: typeof Wallet; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5">
      <span className="flex h-14 w-full items-center justify-center rounded-2xl bg-white text-maroon-700 shadow-card dark:bg-gray-900">
        <Icon size={22} />
      </span>
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
    </Link>
  )
}
