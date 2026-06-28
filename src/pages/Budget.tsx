import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { MonthSelector } from '@/components/MonthSelector'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Sheet } from '@/components/ui/Sheet'
import { useUIStore } from '@/store/uiStore'
import { useCategories } from '@/hooks/useCategories'
import { useBudgets, useBudgetMutations } from '@/hooks/useBudgets'
import { useTransactions } from '@/hooks/useTransactions'
import { buildPeriode } from '@/lib/dateRange'
import { txFlow } from '@/lib/summary'
import { formatRupiah, parseRupiah } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import { Repeat } from 'lucide-react'

export function Budget() {
  const iso = useUIStore((s) => s.activeMonthISO)
  const periode = useMemo(() => buildPeriode(new Date(iso)), [iso])

  const { data: expenseCats = [] } = useCategories('expense')
  const { data: budgets = [] } = useBudgets(periode)
  const { data: txs = [] } = useTransactions(periode)
  const { save, remove } = useBudgetMutations()

  const [editCat, setEditCat] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [allMonths, setAllMonths] = useState(false)

  // Pengeluaran aktual per kategori (konsumsi nyata)
  const spent = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txs) {
      const exp = txFlow(t).expense
      if (exp > 0 && t.category_id) m.set(t.category_id, (m.get(t.category_id) ?? 0) + exp)
    }
    return m
  }, [txs])

  const budgetByCat = useMemo(() => {
    const m = new Map<string, (typeof budgets)[number]>()
    for (const b of budgets) m.set(b.category_id, b)
    return m
  }, [budgets])

  function openEdit(catId: string) {
    setEditCat(catId)
    const existing = budgetByCat.get(catId)
    setInput(existing ? String(existing.amount) : '')
    setAllMonths(existing ? existing.month === 0 : true) // default: berlaku semua bulan
  }

  async function handleSave() {
    if (!editCat) return
    const amount = parseRupiah(input)
    if (amount <= 0) {
      const b = budgetByCat.get(editCat)
      if (b) await remove.mutateAsync(b.id)
    } else {
      await save.mutateAsync({
        category_id: editCat,
        amount,
        month: allMonths ? 0 : periode.month,
        year: allMonths ? 0 : periode.year,
      })
    }
    setEditCat(null)
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Anggaran" />
      <MonthSelector className="mb-4" />
      <p className="mb-3 text-sm text-gray-400">
        Atur batas pengeluaran tiap kategori. Warna berubah saat mendekati limit.
      </p>

      <div className="space-y-3">
        {expenseCats.map((c) => {
          const b = budgetByCat.get(c.id)
          const used = spent.get(c.id) ?? 0
          const limit = b?.amount ?? 0
          const ratio = limit > 0 ? used / limit : 0
          const over = limit > 0 && used > limit
          return (
            <Card key={c.id} onClick={() => openEdit(c.id)}>
              <div className="mb-2 flex items-center gap-3">
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="flex-1 font-semibold">
                  {c.name}
                  {b?.month === 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-dusty-100 px-1.5 py-0.5 align-middle text-[9px] font-semibold text-maroon-700 dark:bg-dusty-500/15">
                      <Repeat size={9} /> tiap bulan
                    </span>
                  )}
                </span>
                <span className="nums text-sm text-gray-500">
                  {limit > 0 ? (
                    <>
                      {formatRupiah(used)} <span className="text-gray-300">/</span> {formatRupiah(limit)}
                    </>
                  ) : (
                    <span className="text-xs text-maroon-700">Atur anggaran</span>
                  )}
                </span>
              </div>
              {limit > 0 && <ProgressBar ratio={ratio} />}
              {over && (
                <p className="mt-1 text-xs font-medium text-wine-500">
                  Melebihi anggaran {formatRupiah(used - limit)}!
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Sheet set anggaran */}
      <Sheet open={!!editCat} onClose={() => setEditCat(null)} title="Atur Anggaran">
        <p className="mb-2 text-center text-sm text-gray-400">
          {expenseCats.find((c) => c.id === editCat)?.name}
        </p>
        <input
          autoFocus
          inputMode="numeric"
          value={input ? formatRupiah(parseRupiah(input), false) : ''}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0"
          className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />
        {/* Toggle berlaku semua bulan */}
        <button
          onClick={() => setAllMonths((v) => !v)}
          className={clsx(
            'mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm',
            allMonths ? 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/10' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
          )}
        >
          <span className="flex items-center gap-2"><Repeat size={16} /> Berlaku untuk semua bulan</span>
          <span className={clsx('h-5 w-9 rounded-full p-0.5 transition', allMonths ? 'bg-dusty-500' : 'bg-gray-300 dark:bg-gray-600')}>
            <span className={clsx('block h-4 w-4 rounded-full bg-white transition', allMonths && 'translate-x-4')} />
          </span>
        </button>
        <p className="mb-4 -mt-2 text-center text-[11px] text-gray-400">
          {allMonths ? 'Anggaran ini dipakai di SEMUA bulan. Mau beda di bulan tertentu? Matikan toggle saat di bulan itu.' : 'Hanya berlaku untuk bulan yang sedang dipilih.'}
        </p>
        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft"
        >
          Simpan
        </button>
      </Sheet>
    </div>
  )
}
