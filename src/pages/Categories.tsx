import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Sheet } from '@/components/ui/Sheet'
import { useCategories, useCategoryMutations } from '@/hooks/useCategories'
import { ICON_NAMES, COLOR_OPTIONS } from '@/lib/icons'
import { clsx } from '@/lib/clsx'
import type { Category, TxType } from '@/types'

export function Categories() {
  const { data: cats = [] } = useCategories()
  const { create, update, remove } = useCategoryMutations()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICON_NAMES[0])
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [type, setType] = useState<TxType>('expense')

  function openNew(t: TxType) {
    setEditing(null)
    setName('')
    setIcon(ICON_NAMES[0])
    setColor(COLOR_OPTIONS[0])
    setType(t)
    setOpen(true)
  }
  function openEdit(c: Category) {
    setEditing(c)
    setName(c.name)
    setIcon(c.icon)
    setColor(c.color)
    setType(c.type)
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    const payload = { name: name.trim(), icon, color, type }
    if (editing) await update.mutateAsync({ id: editing.id, ...payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  const income = cats.filter((c) => c.type === 'income')
  const expense = cats.filter((c) => c.type === 'expense')

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Kategori" />

      <Section title="Pengeluaran" cats={expense} onAdd={() => openNew('expense')} onEdit={openEdit} />
      <Section title="Pemasukan" cats={income} onAdd={() => openNew('income')} onEdit={openEdit} />

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Kategori' : 'Kategori Baru'}>
        {/* Preview */}
        <div className="mb-4 flex justify-center">
          <CategoryIcon icon={icon} color={color} size="lg" />
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kategori"
          className="mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-base font-semibold outline-none dark:bg-gray-800"
        />

        {/* Pilih ikon */}
        <p className="mb-2 text-xs font-medium text-gray-400">Ikon</p>
        <div className="mb-4 grid grid-cols-6 gap-2">
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              onClick={() => setIcon(n)}
              className={clsx('flex items-center justify-center rounded-xl p-1', icon === n && 'ring-2 ring-emerald-500')}
            >
              <CategoryIcon icon={n} color={color} size="sm" />
            </button>
          ))}
        </div>

        {/* Pilih warna */}
        <p className="mb-2 text-xs font-medium text-gray-400">Warna</p>
        <div className="mb-5 grid grid-cols-8 gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={clsx('h-8 w-8 rounded-full', color === c && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900')}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {editing && !editing.is_default && (
            <button
              onClick={() => confirm('Hapus kategori ini?') && remove.mutate(editing.id, { onSuccess: () => setOpen(false) })}
              className="rounded-2xl bg-rose-50 px-4 font-semibold text-rose-500 dark:bg-rose-500/10"
            >
              Hapus
            </button>
          )}
          <button onClick={handleSave} className="h-12 flex-1 rounded-2xl bg-emerald-500 font-bold text-white shadow-soft">
            Simpan
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function Section({
  title,
  cats,
  onAdd,
  onEdit,
}: {
  title: string
  cats: Category[]
  onAdd: () => void
  onEdit: (c: Category) => void
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <button onClick={onAdd} className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
          <Plus size={16} /> Tambah
        </button>
      </div>
      <Card className="divide-y divide-gray-100 dark:divide-gray-800">
        {cats.map((c) => (
          <button key={c.id} onClick={() => onEdit(c)} className="flex w-full items-center gap-3 py-2.5 text-left">
            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
            <span className="flex-1 text-sm font-medium">{c.name}</span>
            {c.is_default && <span className="text-[10px] text-gray-400">default</span>}
            <Pencil size={15} className="text-gray-300" />
          </button>
        ))}
      </Card>
    </div>
  )
}
