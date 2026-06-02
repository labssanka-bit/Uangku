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
import { formatRupiah, parseRupiah } from '@/lib/format'

export function Budget() {
  const iso = useUIStore((s) => s.activeMonthISO)
  const periode = useMemo(() => buildPeriode(new Date(iso)), [iso])

  const { data: expenseCats = [] } = useCategories('expense')
  const { data: budgets = [] } = useBudgets(periode)
  const { data: txs = [] } = useTransactions(periode)
  const { save, remove } = useBudgetMutations()

  const [editCat, setEditCat] = useState<string | null>(null)
  const [input, setInput] = useState('')

  // Pengeluaran aktual per kategori
  const spent = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of txs)
      if (t.type === 'expense' && t.category_id)
        m.set(t.category_id, (m.get(t.category_id) ?? 0) + t.amount)
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
        month: periode.month,
        year: periode.year,
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
                <span className="flex-1 font-semibold">{c.name}</span>
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
          className="nums mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />
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
