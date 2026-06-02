import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, Wallet, PiggyBank, Repeat, Tags, Settings as Cog, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MonthSelector } from '@/components/MonthSelector'
import { ThemeToggles } from '@/components/layout/ThemeToggles'
import { TransactionItem } from '@/components/TransactionItem'
import { useUIStore } from '@/store/uiStore'
import { useProfile } from '@/hooks/useProfile'
import { useTransactions, useRecentTransactions, useTotalBalance } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import { buildPeriode } from '@/lib/dateRange'
import { summarize, buildInsight } from '@/lib/summary'
import { formatRupiah } from '@/lib/format'

export function Dashboard({ onAdd: _onAdd }: { onAdd: () => void }) {
  const iso = useUIStore((s) => s.activeMonthISO)
  const privacy = useUIStore((s) => s.privacy)
  const togglePrivacy = useUIStore((s) => s.togglePrivacy)
  const ref = new Date(iso)
  const periode = useMemo(() => buildPeriode(ref), [iso]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: profile } = useProfile()
  const { data: txs = [] } = useTransactions(periode)
  const { data: recent = [] } = useRecentTransactions(5)
  const { data: balance = 0 } = useTotalBalance()
  const { data: budgets = [] } = useBudgets(periode)

  const summary = useMemo(() => summarize(txs, ref), [txs]) // eslint-disable-line react-hooks/exhaustive-deps
  const insight = useMemo(() => buildInsight(summary, balance, ref), [summary, balance]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <p className="text-sm capitalize text-gray-400">{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(ref)}</p>
        </div>
        <ThemeToggles />
      </div>

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

      {/* Selector bulan */}
      <MonthSelector className="my-4" />

      {/* Kartu insight */}
      <div className="mb-4 flex gap-3 rounded-2xl bg-dusty-100 p-4 dark:bg-dusty-500/10">
        <Sparkles className="mt-0.5 shrink-0 text-dusty-600" size={20} />
        <p className="text-sm leading-relaxed text-maroon-800 dark:text-dusty-200">{insight}</p>
      </div>

      {/* Menu cepat */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <QuickMenu to="/anggaran" icon={PiggyBank} label="Anggaran" />
        <QuickMenu to="/berulang" icon={Repeat} label="Berulang" />
        <QuickMenu to="/kategori" icon={Tags} label="Kategori" />
        <QuickMenu to="/setting" icon={Cog} label="Setting" />
      </div>

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
