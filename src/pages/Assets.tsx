import { useMemo, useState } from 'react'
import { Plus, Gem, TrendingUp, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amount } from '@/components/ui/Amount'
import { Sheet } from '@/components/ui/Sheet'
import { useAssets, useAssetMutations } from '@/hooks/useAssets'
import { useWalletBalances } from '@/hooks/useWallets'
import { formatRupiah, parseRupiah, toISODate } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { Asset, AssetType } from '@/types'

const TYPE_META: Record<AssetType, { label: string; icon: string; color: string }> = {
  emas: { label: 'Emas', icon: 'gem', color: '#f59e0b' },
  properti: { label: 'Properti', icon: 'building-2', color: '#8b5cf6' },
  saham: { label: 'Saham', icon: 'trending-up', color: '#3E7A66' },
  reksadana: { label: 'Reksadana', icon: 'coins', color: '#06b6d4' },
  lainnya: { label: 'Lainnya', icon: 'tag', color: '#64748b' },
}

export function Assets() {
  const { data: assets = [] } = useAssets()
  const { create, update, remove } = useAssetMutations()
  const { total: walletTotal } = useWalletBalances()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('emas')
  const [quantity, setQuantity] = useState('1')
  const [pricePerUnit, setPricePerUnit] = useState('') // utk emas: harga/gram
  const [buyPrice, setBuyPrice] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))

  const totalAsset = useMemo(() => assets.reduce((a, x) => a + x.current_value, 0), [assets])
  const netWorth = walletTotal + totalAsset

  function openNew() {
    setEditing(null)
    setName('')
    setType('emas')
    setQuantity('1')
    setPricePerUnit('')
    setBuyPrice('')
    setCurrentValue('')
    setDate(toISODate(new Date()))
    setOpen(true)
  }
  function openEdit(a: Asset) {
    setEditing(a)
    setName(a.name)
    setType(a.type)
    setQuantity(String(a.quantity))
    setPricePerUnit('')
    setBuyPrice(String(a.buy_price))
    setCurrentValue(String(a.current_value))
    setDate(a.date)
    setOpen(true)
  }

  // Emas: nilai sekarang auto = gram × harga/gram
  const isGold = type === 'emas'
  const qtyNum = parseFloat(quantity.replace(',', '.')) || 0
  const computedCurrent = isGold && pricePerUnit ? qtyNum * parseRupiah(pricePerUnit) : parseRupiah(currentValue)

  async function handleSave() {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      type,
      quantity: qtyNum || 1,
      buy_price: parseRupiah(buyPrice),
      current_value: computedCurrent,
      date,
      note: null as string | null,
    }
    if (editing) await update.mutateAsync({ id: editing.id, ...payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Aset"
        action={
          <button onClick={openNew} className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-700 text-white shadow-card" aria-label="Tambah">
            <Plus size={20} />
          </button>
        }
      />

      {/* Total kekayaan */}
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-maroon-700 to-maroon-900 p-5 text-white shadow-soft">
        <span className="text-sm opacity-90">Total Kekayaan</span>
        <p className="nums mt-1 text-3xl font-extrabold">{formatRupiah(netWorth)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/15 p-2">
            <span className="text-xs opacity-90">Dompet</span>
            <p className="nums font-bold">{formatRupiah(walletTotal)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-2">
            <span className="text-xs opacity-90">Aset</span>
            <p className="nums font-bold">{formatRupiah(totalAsset)}</p>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
          <Gem size={32} />
          <p className="text-sm">Belum ada aset. Catat emas, properti, atau investasimu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((a) => {
            const meta = TYPE_META[a.type]
            const gain = a.current_value - a.buy_price
            const up = gain >= 0
            return (
              <Card key={a.id} onClick={() => openEdit(a)} className="flex items-center gap-3">
                <CategoryIcon icon={meta.icon} color={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-400">
                    {meta.label}{a.type === 'emas' ? ` · ${a.quantity} gram` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <Amount value={a.current_value} className="block text-sm font-bold" />
                  {a.buy_price > 0 && (
                    <span className={clsx('flex items-center justify-end gap-0.5 text-xs font-medium', up ? 'text-sage-600' : 'text-wine-500')}>
                      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatRupiah(Math.abs(gain))}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet tambah/edit */}
      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Aset' : 'Aset Baru'}>
        {/* Tipe */}
        <div className="mb-3 grid grid-cols-5 gap-2">
          {(Object.keys(TYPE_META) as AssetType[]).map((t) => (
            <button key={t} onClick={() => setType(t)} className={clsx('flex flex-col items-center gap-1 rounded-2xl p-2', type === t && 'ring-2 ring-maroon-600')}>
              <CategoryIcon icon={TYPE_META[t].icon} color={TYPE_META[t].color} size="sm" />
              <span className="text-[10px]">{TYPE_META[t].label}</span>
            </button>
          ))}
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={isGold ? 'mis. Emas Antam' : 'Nama aset'} className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800" />

        {isGold ? (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Berat (gram)</span>
              <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Harga / gram</span>
              <input inputMode="numeric" value={pricePerUnit ? formatRupiah(parseRupiah(pricePerUnit), false) : ''} onChange={(e) => setPricePerUnit(e.target.value)} className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
            </label>
          </div>
        ) : (
          <label className="mb-3 block">
            <span className="text-xs text-gray-400">Nilai sekarang</span>
            <input inputMode="numeric" value={currentValue ? formatRupiah(parseRupiah(currentValue), false) : ''} onChange={(e) => setCurrentValue(e.target.value)} placeholder="0" className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-lg font-bold outline-none dark:bg-gray-800" />
          </label>
        )}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Harga beli (total)</span>
            <input inputMode="numeric" value={buyPrice ? formatRupiah(parseRupiah(buyPrice), false) : ''} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Tanggal</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
          </label>
        </div>

        {/* Preview nilai */}
        <div className="mb-4 rounded-2xl bg-dusty-100 p-3 text-center dark:bg-dusty-500/10">
          <span className="text-xs text-maroon-700 dark:text-dusty-300">Nilai sekarang</span>
          <p className="nums text-xl font-extrabold text-maroon-800 dark:text-dusty-200">{formatRupiah(computedCurrent)}</p>
        </div>

        <div className="flex gap-2">
          {editing && (
            <button onClick={() => confirm('Hapus aset ini?') && remove.mutate(editing.id, { onSuccess: () => setOpen(false) })} className="rounded-2xl bg-wine-50 px-4 font-semibold text-wine-500 dark:bg-wine-500/10">
              Hapus
            </button>
          )}
          <button onClick={handleSave} className="h-12 flex-1 rounded-2xl bg-maroon-700 font-bold text-white shadow-soft">Simpan</button>
        </div>
      </Sheet>
    </div>
  )
}
