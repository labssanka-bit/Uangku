import { useState } from 'react'
import { Plus, Pencil, EyeOff, Eye, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Sheet } from '@/components/ui/Sheet'
import { useCategories, useCategoryMutations, useCategoryUsage } from '@/hooks/useCategories'
import { ICON_NAMES, COLOR_OPTIONS } from '@/lib/icons'
import { clsx } from '@/lib/clsx'
import type { Category, TxType } from '@/types'

export function Categories() {
  const { data: cats = [] } = useCategories(undefined, true) // termasuk yang disembunyikan
  const { data: usage } = useCategoryUsage()
  const { create, update, remove, setHidden } = useCategoryMutations()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICON_NAMES[0])
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [type, setType] = useState<TxType>('expense')
  const [busy, setBusy] = useState(false)

  const dipakai = editing ? (usage?.get(editing.id) ?? 0) : 0

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

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'terjadi kesalahan.')

  async function handleSave() {
    if (!name.trim()) return
    const payload = { name: name.trim(), icon, color, type }
    setBusy(true)
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload })
      else await create.mutateAsync(payload)
      setOpen(false)
    } catch (e) {
      alert('Gagal menyimpan kategori: ' + errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  /** Hapus permanen — konfirmasi menyebut dampak nyata sesuai jumlah pemakaian. */
  async function handleDelete() {
    if (!editing) return
    const pesan =
      dipakai > 0
        ? `Hapus kategori "${editing.name}"?\n\n` +
          `Kategori ini dipakai ${dipakai} transaksi.\n` +
          `• Transaksinya TETAP ADA (nominal & tanggal aman), tapi kehilangan label kategori ini — di Statistik akan masuk "Lainnya".\n` +
          `• Anggaran kategori ini ikut terhapus.\n` +
          `• Tindakan ini TIDAK BISA dibatalkan.\n\n` +
          `Kalau cuma ingin merapikan daftar, pilih "Sembunyikan" saja — riwayat tetap utuh.`
        : `Hapus kategori "${editing.name}"?\n\nKategori ini belum dipakai transaksi apa pun, jadi aman dihapus.`
    if (!confirm(pesan)) return
    setBusy(true)
    try {
      await remove.mutateAsync(editing.id)
      setOpen(false)
    } catch (e) {
      alert('Gagal menghapus kategori: ' + errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  /** Sembunyikan / tampilkan lagi — tidak menyentuh data sama sekali. */
  async function handleToggleHidden() {
    if (!editing) return
    setBusy(true)
    try {
      await setHidden.mutateAsync({ id: editing.id, hidden: !editing.hidden })
      setOpen(false)
    } catch (e) {
      alert('Gagal mengubah kategori: ' + errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const income = cats.filter((c) => c.type === 'income')
  const expense = cats.filter((c) => c.type === 'expense')

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Kategori" />
      <p className="mb-3 text-sm text-gray-400">
        Ketuk kategori untuk mengubah, <b className="text-maroon-700 dark:text-dusty-200">menyembunyikan</b>, atau menghapusnya.
        Menyembunyikan hanya merapikan daftar — riwayat transaksimu tetap utuh.
      </p>

      <Section title="Pengeluaran" cats={expense} usage={usage} onAdd={() => openNew('expense')} onEdit={openEdit} />
      <Section title="Pemasukan" cats={income} usage={usage} onAdd={() => openNew('income')} onEdit={openEdit} />

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
              className={clsx('flex items-center justify-center rounded-xl p-1', icon === n && 'ring-2 ring-maroon-600')}
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

        <button
          onClick={handleSave}
          disabled={busy}
          className="h-12 w-full rounded-2xl bg-maroon-700 font-bold text-white shadow-soft disabled:opacity-50"
        >
          {busy ? 'Menyimpan…' : 'Simpan'}
        </button>

        {editing && (
          <>
            {/* Info pemakaian — biar keputusan user berdasar fakta */}
            <p className="mt-4 text-center text-xs text-gray-400">
              {dipakai > 0
                ? `Kategori ini dipakai ${dipakai} transaksi.`
                : 'Kategori ini belum dipakai transaksi apa pun.'}
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={handleToggleHidden}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 py-3 text-sm font-bold text-gray-600 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300"
              >
                {editing.hidden ? <><Eye size={16} /> Tampilkan</> : <><EyeOff size={16} /> Sembunyikan</>}
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-wine-50 py-3 text-sm font-bold text-wine-500 disabled:opacity-50 dark:bg-wine-500/10"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              {dipakai > 0
                ? 'Sembunyikan = daftar rapi, riwayat aman. Hapus = permanen, transaksi lama kehilangan label ini.'
                : 'Aman dihapus karena belum dipakai.'}
            </p>
          </>
        )}
      </Sheet>
    </div>
  )
}

function Section({
  title,
  cats,
  usage,
  onAdd,
  onEdit,
}: {
  title: string
  cats: Category[]
  usage?: Map<string, number>
  onAdd: () => void
  onEdit: (c: Category) => void
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <button onClick={onAdd} className="flex items-center gap-1 text-sm font-semibold text-maroon-700">
          <Plus size={16} /> Tambah
        </button>
      </div>
      <Card className="divide-y divide-gray-100 dark:divide-gray-800">
        {cats.map((c) => {
          const n = usage?.get(c.id) ?? 0
          return (
            <button
              key={c.id}
              onClick={() => onEdit(c)}
              className={clsx('flex w-full items-center gap-3 py-2.5 text-left', c.hidden && 'opacity-50')}
            >
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className="flex-1 truncate text-sm font-medium">
                {c.name}
                {c.hidden && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 align-middle text-[9px] font-semibold text-gray-500 dark:bg-gray-800">
                    <EyeOff size={9} /> disembunyikan
                  </span>
                )}
              </span>
              {n > 0 && <span className="nums shrink-0 text-[11px] text-gray-400">{n}x</span>}
              <Pencil size={15} className="shrink-0 text-gray-300" />
            </button>
          )
        })}
      </Card>
    </div>
  )
}
