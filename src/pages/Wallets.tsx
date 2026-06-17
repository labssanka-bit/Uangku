import { useState } from 'react'
import { Plus, Wallet as WalletIcon, ArrowRightLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Amount } from '@/components/ui/Amount'
import { Sheet } from '@/components/ui/Sheet'
import { useWalletBalances, useWalletMutations } from '@/hooks/useWallets'
import { ICON_NAMES, COLOR_OPTIONS } from '@/lib/icons'
import { formatRupiah, parseRupiah, toISODate } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { WalletGroup, Wallet } from '@/types'

const GROUP_LABEL: Record<WalletGroup, string> = {
  cashflow: 'Cashflow',
  saving: 'Saving',
}

const WALLET_ICONS = ['wallet', 'landmark', 'credit-card', 'piggy-bank', 'banknote', 'coins', 'building-2', 'smartphone']

export function Wallets() {
  const { wallets, cashflowTotal, savingTotal } = useWalletBalances()
  const { create, update, remove, transfer } = useWalletMutations()

  // Sheet dompet baru/edit
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [group, setGroup] = useState<WalletGroup>('cashflow')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('wallet')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [opening, setOpening] = useState('')

  // Sheet transfer
  const [transferOpen, setTransferOpen] = useState(false)
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferDate, setTransferDate] = useState(toISODate(new Date()))
  const [transferError, setTransferError] = useState<string | null>(null)

  function openNew(g: WalletGroup) {
    setEditing(null)
    setGroup(g)
    setName('')
    setIcon('wallet')
    setColor('#72283A')
    setOpening('')
    setOpen(true)
  }
  function openEdit(w: Wallet) {
    setEditing(w)
    setGroup(w.group)
    setName(w.name)
    setIcon(w.icon)
    setColor(w.color)
    setOpening(w.opening_balance ? String(w.opening_balance) : '')
    setOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    const payload = { group, name: name.trim(), icon, color, opening_balance: parseRupiah(opening) }
    if (editing) await update.mutateAsync({ id: editing.id, ...payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  function openTransfer() {
    const cashflow = wallets.filter((w) => w.group === 'cashflow')
    const first = cashflow[0]
    const second = cashflow[1] ?? wallets.find((w) => w.group === 'saving')
    setFromId(first?.id ?? wallets[0]?.id ?? '')
    setToId(second?.id ?? '')
    setTransferAmount('')
    setTransferNote('')
    setTransferDate(toISODate(new Date()))
    setTransferError(null)
    setTransferOpen(true)
  }

  async function handleTransfer() {
    const amt = parseRupiah(transferAmount)
    if (!fromId || !toId || amt <= 0) {
      setTransferError('Isi semua field dan nominal > 0.')
      return
    }
    if (fromId === toId) {
      setTransferError('Dompet asal dan tujuan tidak boleh sama.')
      return
    }
    setTransferError(null)
    const fromWallet = wallets.find((w) => w.id === fromId)
    const toWallet = wallets.find((w) => w.id === toId)
    try {
      await transfer.mutateAsync({
        fromId,
        fromName: fromWallet?.name ?? 'Dompet',
        toId,
        toName: toWallet?.name ?? 'Dompet',
        amount: amt,
        note: transferNote.trim(),
        date: transferDate,
      })
      setTransferOpen(false)
    } catch (e) {
      setTransferError(e instanceof Error ? e.message : 'Gagal melakukan transfer.')
    }
  }

  const groups: WalletGroup[] = ['cashflow', 'saving']

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Dompet"
        action={
          <button
            onClick={openTransfer}
            className="flex items-center gap-1.5 rounded-full bg-maroon-700 px-3 py-2 text-sm font-semibold text-white shadow-card"
          >
            <ArrowRightLeft size={16} /> Transfer
          </button>
        }
      />

      {/* Ringkasan grup */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="bg-maroon-50 dark:bg-maroon-500/10">
          <span className="text-xs font-medium text-maroon-700">Cashflow</span>
          <Amount value={cashflowTotal} className="mt-1 block text-lg font-extrabold text-maroon-800 dark:text-maroon-200" />
        </Card>
        <Card className="bg-sage-50 dark:bg-sage-500/10">
          <span className="text-xs font-medium text-sage-700">Saving</span>
          <Amount value={savingTotal} className="mt-1 block text-lg font-extrabold text-sage-700" />
        </Card>
      </div>

      {groups.map((g) => (
        <div key={g} className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">{GROUP_LABEL[g]}</h2>
            <button onClick={() => openNew(g)} className="flex items-center gap-1 text-sm font-semibold text-maroon-700">
              <Plus size={16} /> Tambah
            </button>
          </div>
          <div className="space-y-2">
            {wallets.filter((w) => w.group === g).map((w) => (
              <Card key={w.id} onClick={() => openEdit(w)} className="flex items-center gap-3">
                <CategoryIcon icon={w.icon} color={w.color} />
                <span className="flex-1 font-semibold">{w.name}</span>
                <Amount value={w.balance} className="font-bold" />
              </Card>
            ))}
            {wallets.filter((w) => w.group === g).length === 0 && (
              <p className="py-3 text-center text-sm text-gray-400">Belum ada dompet.</p>
            )}
          </div>
        </div>
      ))}

      {/* Sheet transfer */}
      <Sheet open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Dompet">
        <p className="mb-4 text-center text-xs text-gray-400">
          Pindah uang antar dompet. Saldo dompet asal berkurang, tujuan bertambah.
        </p>

        <label className="mb-3 block">
          <span className="text-xs text-gray-400">Dari dompet</span>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({GROUP_LABEL[w.group]}) — {formatRupiah(w.balance)}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 block">
          <span className="text-xs text-gray-400">Ke dompet</span>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({GROUP_LABEL[w.group]}) — {formatRupiah(w.balance)}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 block">
          <span className="text-xs text-gray-400">Nominal</span>
          <input
            inputMode="numeric"
            value={transferAmount ? formatRupiah(parseRupiah(transferAmount), false) : ''}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0"
            className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
          />
        </label>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Tanggal</span>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Catatan (opsional)</span>
            <input
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="mis. Nabung"
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
            />
          </label>
        </div>

        {transferError && (
          <p className="mb-3 rounded-xl bg-wine-50 px-3 py-2 text-center text-xs text-wine-600 dark:bg-wine-500/10">
            {transferError}
          </p>
        )}

        <button
          onClick={handleTransfer}
          disabled={transfer.isPending}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft disabled:opacity-50"
        >
          {transfer.isPending ? 'Memproses…' : 'Transfer'}
        </button>
      </Sheet>

      {/* Sheet tambah/edit dompet */}
      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Dompet' : 'Dompet Baru'}>
        <div className="mb-4 flex justify-center">
          <CategoryIcon icon={icon} color={color} size="lg" />
        </div>

        <div className="mb-3 flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={clsx('flex-1 rounded-xl py-2 text-sm font-semibold', group === g ? 'bg-maroon-700 text-white' : 'text-gray-500')}
            >
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama dompet (mis. BCA, GoPay)"
          className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
        />

        <label className="mb-3 block">
          <span className="text-xs text-gray-400">Saldo awal dompet</span>
          <input
            inputMode="numeric"
            value={opening ? formatRupiah(parseRupiah(opening), false) : ''}
            onChange={(e) => setOpening(e.target.value)}
            placeholder="0"
            className="nums mt-1 w-full rounded-2xl bg-gray-100 px-4 py-3 text-lg font-bold outline-none dark:bg-gray-800"
          />
        </label>

        <p className="mb-2 text-xs font-medium text-gray-400">Ikon</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {WALLET_ICONS.filter((n) => ICON_NAMES.includes(n)).map((n) => (
            <button key={n} onClick={() => setIcon(n)} className={clsx('rounded-xl p-1', icon === n && 'ring-2 ring-maroon-600')}>
              <CategoryIcon icon={n} color={color} size="sm" />
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-8 gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={clsx('h-8 w-8 rounded-full', color === c && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900')} />
          ))}
        </div>

        <div className="flex gap-2">
          {editing && !editing.is_default && (
            <button
              onClick={() => confirm('Hapus dompet ini? Transaksi terkait jadi tanpa dompet.') && remove.mutate(editing.id, { onSuccess: () => setOpen(false) })}
              className="rounded-2xl bg-wine-50 px-4 font-semibold text-wine-500 dark:bg-wine-500/10"
            >
              Hapus
            </button>
          )}
          <button onClick={handleSave} className="h-12 flex-1 rounded-2xl bg-maroon-700 font-bold text-white shadow-soft">
            Simpan
          </button>
        </div>
        {editing?.is_default && <p className="mt-2 text-center text-xs text-gray-400"><WalletIcon size={12} className="mb-0.5 inline" /> Dompet default tak bisa dihapus.</p>}
      </Sheet>
    </div>
  )
}
