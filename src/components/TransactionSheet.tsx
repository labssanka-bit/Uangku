import { useEffect, useMemo, useState } from 'react'
import { Trash2, Repeat } from 'lucide-react'
import { Sheet } from './ui/Sheet'
import { Numpad } from './ui/Numpad'
import { CategoryIcon } from './ui/CategoryIcon'
import { useCategories } from '@/hooks/useCategories'
import { useTransactionMutations } from '@/hooks/useTransactions'
import { formatRupiah, toISODate } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { Transaction, TxType } from '@/types'

import type { AddPreset } from '@/store/uiStore'

interface Props {
  open: boolean
  onClose: () => void
  /** Jika diisi → mode edit */
  editing?: Transaction | null
  /** Prefill saat tambah baru (quick-add) */
  preset?: AddPreset | null
}

/** Sheet tambah/edit transaksi: toggle tipe, nominal+numpad, kategori, tanggal, catatan. */
export function TransactionSheet({ open, onClose, editing, preset }: Props) {
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(toISODate(new Date()))
  const [note, setNote] = useState('')
  const [recurring, setRecurring] = useState(false)

  const { data: categories = [] } = useCategories(type)
  const { create, update, remove } = useTransactionMutations()

  // Isi form saat membuka untuk edit / reset saat tambah baru
  useEffect(() => {
    if (!open) return
    if (editing) {
      setType(editing.type)
      setAmount(editing.amount)
      setCategoryId(editing.category_id)
      setDate(editing.date)
      setNote(editing.note ?? '')
      setRecurring(editing.is_recurring)
    } else {
      // Tambah baru — pakai preset bila ada (quick-add)
      setType(preset?.type ?? 'expense')
      setAmount(0)
      setCategoryId(preset?.category_id ?? null)
      setDate(toISODate(new Date()))
      setNote(preset?.note ?? '')
      setRecurring(false)
    }
  }, [open, editing, preset])

  // Default kategori pertama bila belum dipilih
  const resolvedCategoryId = useMemo(() => {
    if (categoryId && categories.some((c) => c.id === categoryId)) return categoryId
    return categories[0]?.id ?? null
  }, [categoryId, categories])

  const handleDigit = (d: string) => setAmount((a) => Number(`${a}${d}`.slice(0, 13)))
  const handleBackspace = () => setAmount((a) => Math.floor(a / 10))

  const canSave = amount > 0
  const saving = create.isPending || update.isPending

  async function handleSave() {
    if (!canSave) return
    const payload = {
      category_id: resolvedCategoryId,
      amount,
      type,
      note: note.trim() || null,
      date,
      is_recurring: recurring,
    }
    if (editing) await update.mutateAsync({ id: editing.id, ...payload })
    else await create.mutateAsync(payload)
    onClose()
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('Hapus transaksi ini?')) return
    await remove.mutateAsync(editing.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'}>
      {/* Toggle tipe */}
      <div className="mb-4 flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              'flex-1 rounded-xl py-2 text-sm font-semibold transition',
              type === t
                ? t === 'income'
                  ? 'bg-sage-600 text-white shadow'
                  : 'bg-wine-500 text-white shadow'
                : 'text-gray-500'
            )}
          >
            {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </button>
        ))}
      </div>

      {/* Nominal besar */}
      <div className="mb-4 text-center">
        <p className="text-xs text-gray-400">Nominal</p>
        <p
          className={clsx(
            'nums text-4xl font-extrabold',
            type === 'income' ? 'text-sage-600' : 'text-wine-500'
          )}
        >
          {formatRupiah(amount)}
        </p>
      </div>

      {/* Kategori grid */}
      <p className="mb-2 text-xs font-medium text-gray-400">Kategori</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={clsx(
              'flex flex-col items-center gap-1 rounded-2xl p-2 transition',
              resolvedCategoryId === c.id
                ? 'bg-gray-100 ring-2 ring-maroon-600 dark:bg-gray-800'
                : 'active:bg-gray-50 dark:active:bg-gray-800'
            )}
          >
            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
            <span className="w-full truncate text-center text-[11px]">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Tanggal & catatan */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Tanggal</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Catatan</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Makan siang"
            className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
          />
        </label>
      </div>

      {/* Opsi berulang */}
      <button
        onClick={() => setRecurring((r) => !r)}
        className={clsx(
          'mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm',
          recurring
            ? 'bg-dusty-100 text-dusty-600 dark:bg-dusty-500/10'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
        )}
      >
        <span className="flex items-center gap-2">
          <Repeat size={16} /> Jadikan transaksi berulang
        </span>
        <span className={clsx('h-5 w-9 rounded-full p-0.5 transition', recurring ? 'bg-dusty-500' : 'bg-gray-300 dark:bg-gray-600')}>
          <span className={clsx('block h-4 w-4 rounded-full bg-white transition', recurring && 'translate-x-4')} />
        </span>
      </button>

      {/* Numpad */}
      <Numpad onInput={handleDigit} onBackspace={handleBackspace} />

      {/* Aksi */}
      <div className="mt-4 flex gap-2">
        {editing && (
          <button
            onClick={handleDelete}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-wine-50 text-wine-500 dark:bg-wine-500/10"
            aria-label="Hapus"
          >
            <Trash2 size={20} />
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="h-12 flex-1 rounded-2xl bg-maroon-700 text-base font-bold text-white shadow-soft disabled:opacity-40"
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </Sheet>
  )
}
