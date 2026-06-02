import { useMemo, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { MonthSelector } from '@/components/MonthSelector'
import { TransactionItem } from '@/components/TransactionItem'
import { TransactionSheet } from '@/components/TransactionSheet'
import { Amount } from '@/components/ui/Amount'
import { useTransactions } from '@/hooks/useTransactions'
import { useUIStore } from '@/store/uiStore'
import { buildPeriode } from '@/lib/dateRange'
import { formatHeaderHari } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { Transaction, TxType } from '@/types'

type Filter = 'all' | TxType

export function Transactions(_: { onAdd: () => void }) {
  const iso = useUIStore((s) => s.activeMonthISO)
  const periode = useMemo(() => buildPeriode(new Date(iso)), [iso])
  const { data: txs = [], isLoading } = useTransactions(periode)

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Filter + search lalu kelompokkan per hari
  const groups = useMemo(() => {
    const filtered = txs.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          t.note?.toLowerCase().includes(q) ||
          t.category?.name.toLowerCase().includes(q)
        )
      }
      return true
    })
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [txs, filter, query])

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setSheetOpen(true)
  }
  function openAdd() {
    setEditing(null)
    setSheetOpen(true)
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="mb-3 text-xl font-extrabold">Transaksi</h1>
      <MonthSelector className="mb-3" />

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-card dark:bg-gray-900">
        <Search size={18} className="text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* Tab filter */}
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-card dark:bg-gray-900">
        {([
          ['all', 'Semua'],
          ['expense', 'Pengeluaran'],
          ['income', 'Pemasukan'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition',
              filter === key ? 'bg-maroon-700 text-white' : 'text-gray-500'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List per hari */}
      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">Memuat…</p>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Tidak ada transaksi.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, items]) => {
            const dayTotal = items.reduce(
              (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
              0
            )
            return (
              <div key={date}>
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold capitalize text-gray-500">
                    {formatHeaderHari(date)}
                  </span>
                  <Amount value={dayTotal} className="text-xs font-semibold text-gray-500" />
                </div>
                <div className="divide-y divide-gray-100 rounded-2xl bg-white px-3 shadow-card dark:divide-gray-800 dark:bg-gray-900">
                  {items.map((t) => (
                    <TransactionItem key={t.id} tx={t} showDate={false} onClick={openEdit} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-white shadow-soft active:scale-95"
        aria-label="Tambah transaksi"
      >
        <Plus size={26} />
      </button>

      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
    </div>
  )
}
