import { useMemo, useState } from 'react'
import { Plus, Gem, TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { fetchMarketPrice } from '@/lib/market'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amount } from '@/components/ui/Amount'
import { Sheet } from '@/components/ui/Sheet'
import { useAssets, useAssetMutations } from '@/hooks/useAssets'
import { useWalletBalances } from '@/hooks/useWallets'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
  const { wallets, total: walletTotal } = useWalletBalances()
  const { user } = useAuth()
  const qc = useQueryClient()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('emas')
  const [quantity, setQuantity] = useState('1')
  // Emas: harga/gram saat beli & harga/gram sekarang
  const [buyPricePerGram, setBuyPricePerGram] = useState('')
  const [currentPricePerGram, setCurrentPricePerGram] = useState('')
  // Non-emas: total buy & current
  const [buyPrice, setBuyPrice] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  // Deduct from wallet
  const [deductFromWallet, setDeductFromWallet] = useState(false)
  const [deductWalletId, setDeductWalletId] = useState<string>('')
  // Ambil harga pasar terkini
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [priceHint, setPriceHint] = useState<string | null>(null)

  async function ambilHarga() {
    setFetchingPrice(true)
    setPriceHint('Mengambil harga terkini…')
    try {
      const res = await fetchMarketPrice(type === 'saham' ? 'saham' : 'emas', name.trim())
      setCurrentPricePerGram(String(res.price))
      setPriceHint(`${formatRupiah(res.price)}/${res.unit} · ${res.source}${res.note ? ' — ' + res.note : ''}`)
    } catch (e) {
      setPriceHint(e instanceof Error ? e.message : 'Gagal mengambil harga.')
    } finally {
      setFetchingPrice(false)
    }
  }

  const totalAsset = useMemo(() => assets.reduce((a, x) => a + x.current_value, 0), [assets])
  const netWorth = walletTotal + totalAsset

  // Rekap emas
  const goldAssets = useMemo(() => assets.filter((a) => a.type === 'emas'), [assets])
  const goldTotalGrams = useMemo(() => goldAssets.reduce((s, a) => s + a.quantity, 0), [goldAssets])
  const goldTotalBuy = useMemo(() => goldAssets.reduce((s, a) => s + a.buy_price, 0), [goldAssets])
  const goldTotalNow = useMemo(() => goldAssets.reduce((s, a) => s + a.current_value, 0), [goldAssets])
  const goldProfit = goldTotalNow - goldTotalBuy

  const isGold = type === 'emas'
  const isSaham = type === 'saham'
  const isPerUnit = isGold || isSaham // input pakai harga per-unit (gram / lembar)
  const LOT_SIZE = 100 // 1 lot saham = 100 lembar (BEI)
  const unitMult = isSaham ? LOT_SIZE : 1 // emas ×1 gram, saham ×100 lembar
  const qtyNum = parseFloat(quantity.replace(',', '.')) || 0

  const buyPricePerGramNum = parseRupiah(buyPricePerGram)
  const currentPricePerGramNum = parseRupiah(currentPricePerGram)

  const computedBuyTotal = isPerUnit ? qtyNum * unitMult * buyPricePerGramNum : parseRupiah(buyPrice)
  const computedCurrentTotal = isPerUnit
    ? qtyNum * unitMult * (currentPricePerGramNum || buyPricePerGramNum)
    : parseRupiah(currentValue)

  function openNew() {
    setEditing(null)
    setName('')
    setType('emas')
    setQuantity('1')
    setBuyPricePerGram('')
    setCurrentPricePerGram('')
    setBuyPrice('')
    setCurrentValue('')
    setDate(toISODate(new Date()))
    setDeductFromWallet(false)
    setDeductWalletId(wallets[0]?.id ?? '')
    setPriceHint(null)
    setOpen(true)
  }

  function openEdit(a: Asset) {
    setEditing(a)
    setName(a.name)
    setType(a.type)
    setQuantity(String(a.quantity))
    if ((a.type === 'emas' || a.type === 'saham') && a.quantity > 0) {
      const mult = a.type === 'saham' ? 100 : 1
      const denom = a.quantity * mult
      setBuyPricePerGram(String(Math.round(a.buy_price / denom)))
      setCurrentPricePerGram(String(Math.round(a.current_value / denom)))
    } else {
      setBuyPricePerGram('')
      setCurrentPricePerGram('')
    }
    setBuyPrice(String(a.buy_price))
    setCurrentValue(String(a.current_value))
    setDate(a.date)
    setDeductFromWallet(false)
    setDeductWalletId(wallets[0]?.id ?? '')
    setPriceHint(null)
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      type,
      quantity: isPerUnit ? qtyNum || 1 : 1,
      buy_price: computedBuyTotal,
      current_value: computedCurrentTotal,
      date,
      note: null as string | null,
    }
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload })
    } else {
      await create.mutateAsync(payload)
      // Opsional: kurangi dari dompet saat beli aset
      if (deductFromWallet && deductWalletId && computedBuyTotal > 0 && user) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: computedBuyTotal,
          type: 'expense',
          wallet_id: deductWalletId,
          note: `Beli aset: ${payload.name}`,
          date: payload.date,
          category_id: null,
          is_recurring: false,
        })
        qc.invalidateQueries({ queryKey: ['transactions'] })
      }
    }
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

      {/* Rekap emas (hanya tampil jika ada) */}
      {goldAssets.length > 0 && (
        <div className="mb-4 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
          <div className="mb-2 flex items-center gap-2">
            <Gem size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Rekap Emas</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-gray-400">Total Gram</p>
              <p className="nums font-bold text-amber-700 dark:text-amber-400">{goldTotalGrams.toFixed(2)} g</p>
            </div>
            <div>
              <p className="text-gray-400">Nilai Beli</p>
              <p className="nums font-bold">{formatRupiah(goldTotalBuy)}</p>
            </div>
            <div>
              <p className="text-gray-400">Nilai Sekarang</p>
              <p className="nums font-bold">{formatRupiah(goldTotalNow)}</p>
            </div>
          </div>
          <div className={clsx('mt-2 text-center text-xs font-semibold', goldProfit >= 0 ? 'text-sage-600' : 'text-wine-500')}>
            {goldProfit >= 0 ? '▲' : '▼'} {goldProfit >= 0 ? 'Untung' : 'Rugi'} {formatRupiah(Math.abs(goldProfit))}
            {goldTotalBuy > 0 && (
              <span className="ml-1 font-normal text-gray-400">
                ({((goldProfit / goldTotalBuy) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

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
            const goldBuyPPG = a.type === 'emas' && a.quantity > 0 ? Math.round(a.buy_price / a.quantity) : 0
            const goldCurPPG = a.type === 'emas' && a.quantity > 0 ? Math.round(a.current_value / a.quantity) : 0
            const shareBuyPL = a.type === 'saham' && a.quantity > 0 ? Math.round(a.buy_price / (a.quantity * 100)) : 0
            const shareCurPL = a.type === 'saham' && a.quantity > 0 ? Math.round(a.current_value / (a.quantity * 100)) : 0
            return (
              <Card key={a.id} onClick={() => openEdit(a)} className="flex items-center gap-3">
                <CategoryIcon icon={meta.icon} color={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-400">
                    {meta.label}
                    {a.type === 'emas' && ` · ${a.quantity} g · beli ${formatRupiah(goldBuyPPG)}/g`}
                    {a.type === 'saham' && ` · ${a.quantity} lot · beli ${formatRupiah(shareBuyPL)}/lembar`}
                    {a.type !== 'emas' && a.type !== 'saham' && a.quantity > 1 && ` · ${a.quantity}`}
                  </p>
                  {a.type === 'emas' && goldCurPPG > 0 && (
                    <p className="text-xs text-amber-600">sekarang {formatRupiah(goldCurPPG)}/g</p>
                  )}
                  {a.type === 'saham' && shareCurPL > 0 && (
                    <p className="text-xs text-sage-600">sekarang {formatRupiah(shareCurPL)}/lembar</p>
                  )}
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

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isGold ? 'mis. Emas Antam' : isSaham ? 'mis. BBCA' : 'Nama aset'}
          className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
        />

        {isGold ? (
          <>
            {/* Emas: gram + harga/gram beli + harga/gram sekarang */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Berat (gram)</span>
                <input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Tanggal beli</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
            </div>
            <label className="mb-3 block">
              <span className="text-xs text-gray-400">Harga beli / gram (Rp)</span>
              <input
                inputMode="numeric"
                value={buyPricePerGram ? formatRupiah(parseRupiah(buyPricePerGram), false) : ''}
                onChange={(e) => setBuyPricePerGram(e.target.value)}
                placeholder="mis. 1.500.000"
                className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-bold outline-none dark:bg-gray-800"
              />
            </label>
            <div className="mb-1 block">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Harga sekarang / gram (Rp) — opsional</span>
                <button
                  type="button"
                  onClick={ambilHarga}
                  disabled={fetchingPrice}
                  className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 disabled:opacity-50 dark:bg-amber-500/15"
                >
                  <RefreshCw size={11} className={fetchingPrice ? 'animate-spin' : ''} /> Ambil harga
                </button>
              </div>
              <input
                inputMode="numeric"
                value={currentPricePerGram ? formatRupiah(parseRupiah(currentPricePerGram), false) : ''}
                onChange={(e) => setCurrentPricePerGram(e.target.value)}
                placeholder={buyPricePerGram ? formatRupiah(parseRupiah(buyPricePerGram), false) : 'sama dgn harga beli'}
                className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-bold outline-none dark:bg-gray-800"
              />
            </div>
            {priceHint && <p className="mb-1 text-center text-[11px] text-gray-500">{priceHint}</p>}
          </>
        ) : isSaham ? (
          <>
            {/* Saham: lot + harga/lembar beli + harga/lembar sekarang (1 lot = 100 lembar) */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Jumlah (Lot)</span>
                <input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Tanggal beli</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
            </div>
            <label className="mb-3 block">
              <span className="text-xs text-gray-400">Harga beli / lembar (Rp)</span>
              <input
                inputMode="numeric"
                value={buyPricePerGram ? formatRupiah(parseRupiah(buyPricePerGram), false) : ''}
                onChange={(e) => setBuyPricePerGram(e.target.value)}
                placeholder="mis. 9.000"
                className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-bold outline-none dark:bg-gray-800"
              />
            </label>
            <div className="mb-1 block">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Harga sekarang / lembar (Rp) — opsional</span>
                <button
                  type="button"
                  onClick={ambilHarga}
                  disabled={fetchingPrice || !name.trim()}
                  className="flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-semibold text-sage-700 disabled:opacity-50 dark:bg-sage-500/15"
                >
                  <RefreshCw size={11} className={fetchingPrice ? 'animate-spin' : ''} /> Ambil harga
                </button>
              </div>
              <input
                inputMode="numeric"
                value={currentPricePerGram ? formatRupiah(parseRupiah(currentPricePerGram), false) : ''}
                onChange={(e) => setCurrentPricePerGram(e.target.value)}
                placeholder={buyPricePerGram ? formatRupiah(parseRupiah(buyPricePerGram), false) : 'sama dgn harga beli'}
                className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-bold outline-none dark:bg-gray-800"
              />
            </div>
            {priceHint ? (
              <p className="mb-1 text-center text-[11px] text-gray-500">{priceHint}</p>
            ) : (
              <p className="mb-1 text-center text-[11px] text-gray-400">
                {qtyNum > 0 && buyPricePerGramNum > 0
                  ? `${qtyNum} lot × 100 lembar × ${formatRupiah(buyPricePerGramNum, false)} = ${formatRupiah(qtyNum * 100 * buyPricePerGramNum)}`
                  : 'Isi nama = kode saham (mis. BBCA), lalu Ambil harga'}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Harga beli (total)</span>
                <input
                  inputMode="numeric"
                  value={buyPrice ? formatRupiah(parseRupiah(buyPrice), false) : ''}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="0"
                  className="nums rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Tanggal</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
            </div>
            <label className="mb-3 block">
              <span className="text-xs text-gray-400">Nilai sekarang</span>
              <input
                inputMode="numeric"
                value={currentValue ? formatRupiah(parseRupiah(currentValue), false) : ''}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-lg font-bold outline-none dark:bg-gray-800"
              />
            </label>
          </>
        )}

        {/* Preview nilai */}
        <div className="mb-3 rounded-2xl bg-dusty-100 p-3 dark:bg-dusty-500/10">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total beli</span>
            <span className="nums font-semibold">{formatRupiah(computedBuyTotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-gray-400">Nilai sekarang</span>
            <span className="nums font-bold text-maroon-800 dark:text-dusty-200">{formatRupiah(computedCurrentTotal)}</span>
          </div>
          {computedBuyTotal > 0 && (
            <div className={clsx('mt-1 flex justify-between text-xs font-semibold', computedCurrentTotal >= computedBuyTotal ? 'text-sage-600' : 'text-wine-500')}>
              <span>{computedCurrentTotal >= computedBuyTotal ? '▲ Untung' : '▼ Rugi'}</span>
              <span className="nums">{formatRupiah(Math.abs(computedCurrentTotal - computedBuyTotal))}</span>
            </div>
          )}
        </div>

        {/* Deduct from wallet (hanya saat tambah baru) */}
        {!editing && wallets.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setDeductFromWallet((v) => !v)}
              className={clsx(
                'mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm',
                deductFromWallet ? 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/10' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              )}
            >
              <span className="flex items-center gap-2"><Wallet size={14} /> Kurangi dari dompet saat beli</span>
              <span className={clsx('h-5 w-9 rounded-full p-0.5 transition', deductFromWallet ? 'bg-dusty-500' : 'bg-gray-300 dark:bg-gray-600')}>
                <span className={clsx('block h-4 w-4 rounded-full bg-white transition', deductFromWallet && 'translate-x-4')} />
              </span>
            </button>
            {deductFromWallet && (
              <select
                value={deductWalletId}
                onChange={(e) => setDeductWalletId(e.target.value)}
                className="w-full rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} — {formatRupiah(w.balance)}</option>
                ))}
              </select>
            )}
          </div>
        )}

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
