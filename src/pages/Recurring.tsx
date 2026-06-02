import { useState } from 'react'
import { Plus, Repeat, Power } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amount } from '@/components/ui/Amount'
import { Sheet } from '@/components/ui/Sheet'
import { useRecurring, useRecurringMutations } from '@/hooks/useRecurring'
import { useCategories } from '@/hooks/useCategories'
import { formatTanggalPanjang, parseRupiah, formatRupiah, toISODate } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { RecurrenceFreq, TxType } from '@/types'

const FREQ_LABEL: Record<RecurrenceFreq, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

export function Recurring() {
  const { data: items = [] } = useRecurring()
  const { create, update, remove } = useRecurringMutations()
  const [open, setOpen] = useState(false)

  // Form state
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [frequency, setFrequency] = useState<RecurrenceFreq>('monthly')
  const [nextDate, setNextDate] = useState(toISODate(new Date()))
  const { data: cats = [] } = useCategories(type)

  async function handleCreate() {
    const amt = parseRupiah(amount)
    if (amt <= 0) return
    await create.mutateAsync({
      category_id: categoryId ?? cats[0]?.id ?? null,
      amount: amt,
      type,
      note: note.trim() || null,
      frequency,
      next_date: nextDate,
    })
    setOpen(false)
    setAmount('')
    setNote('')
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Transaksi Berulang"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-card"
            aria-label="Tambah"
          >
            <Plus size={20} />
          </button>
        }
      />
      <p className="mb-3 text-sm text-gray-400">
        Gaji, langganan, atau tagihan yang berulang otomatis pada tanggalnya.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
          <Repeat size={32} />
          <p className="text-sm">Belum ada transaksi berulang.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} className={clsx(!r.is_active && 'opacity-50')}>
              <div className="flex items-center gap-3">
                <CategoryIcon icon={r.category?.icon} color={r.category?.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.note || r.category?.name}</p>
                  <p className="text-xs text-gray-400">
                    {FREQ_LABEL[r.frequency]} · berikut {formatTanggalPanjang(r.next_date)}
                  </p>
                </div>
                <Amount value={r.amount} signed={r.type} className="text-sm font-bold" />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => update.mutate({ id: r.id, is_active: !r.is_active })}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-100 py-1.5 text-xs font-medium dark:bg-gray-800"
                >
                  <Power size={14} /> {r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  onClick={() => confirm('Hapus transaksi berulang ini?') && remove.mutate(r.id)}
                  className="flex-1 rounded-xl bg-rose-50 py-1.5 text-xs font-medium text-rose-500 dark:bg-rose-500/10"
                >
                  Hapus
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sheet tambah */}
      <Sheet open={open} onClose={() => setOpen(false)} title="Transaksi Berulang Baru">
        <div className="mb-3 flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {(['expense', 'income'] as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx('flex-1 rounded-xl py-2 text-sm font-semibold', type === t ? (t === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : 'text-gray-500')}
            >
              {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>

        <input
          inputMode="numeric"
          value={amount ? formatRupiah(parseRupiah(amount), false) : ''}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nominal"
          className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />

        <div className="mb-3 grid grid-cols-4 gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={clsx('flex flex-col items-center gap-1 rounded-2xl p-2', categoryId === c.id && 'ring-2 ring-emerald-500')}
            >
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className="w-full truncate text-center text-[11px]">{c.name}</span>
            </button>
          ))}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (mis. Gaji bulanan)"
          className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Frekuensi</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFreq)}
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
            >
              {Object.entries(FREQ_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Tanggal berikut</span>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
            />
          </label>
        </div>

        <button onClick={handleCreate} className="w-full rounded-2xl bg-emerald-500 py-3 font-bold text-white shadow-soft">
          Simpan
        </button>
      </Sheet>
    </div>
  )
}
