import { useMemo, useState } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Amount } from '@/components/ui/Amount'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Sheet } from '@/components/ui/Sheet'
import { useDebts, useDebtMutations } from '@/hooks/useDebts'
import { useWallets } from '@/hooks/useWallets'
import { formatRupiah, parseRupiah, formatTanggalPanjang } from '@/lib/format'
import { clsx } from '@/lib/clsx'
import type { Debt, DebtType } from '@/types'

export function Debts() {
  const { data: debts = [] } = useDebts()
  const { data: wallets = [] } = useWallets()
  const { create, remove, pay } = useDebtMutations()

  const [tab, setTab] = useState<DebtType>('hutang')
  const [addOpen, setAddOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Debt | null>(null)

  // Form tambah
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [walletId, setWalletId] = useState<string | null>(null)

  // Form bayar
  const [payAmount, setPayAmount] = useState('')
  const [recordTx, setRecordTx] = useState(true)

  const totals = useMemo(() => {
    let hutang = 0
    let piutang = 0
    for (const d of debts) {
      const sisa = d.amount - d.paid_amount
      if (d.status === 'lunas') continue
      if (d.type === 'hutang') hutang += sisa
      else piutang += sisa
    }
    return { hutang, piutang }
  }, [debts])

  const list = debts.filter((d) => d.type === tab)

  async function handleCreate() {
    const amt = parseRupiah(amount)
    if (!person.trim() || amt <= 0) return
    await create.mutateAsync({
      person: person.trim(),
      amount: amt,
      type: tab,
      due_date: dueDate || null,
      note: note.trim() || null,
      wallet_id: walletId,
    })
    setAddOpen(false)
    setPerson('')
    setAmount('')
    setDueDate('')
    setNote('')
  }

  async function handlePay() {
    if (!payTarget) return
    const amt = parseRupiah(payAmount)
    if (amt <= 0) return
    await pay.mutateAsync({ debt: payTarget, payAmount: amt, recordTx })
    setPayTarget(null)
    setPayAmount('')
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Hutang & Piutang"
        action={
          <button onClick={() => setAddOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-700 text-white shadow-card" aria-label="Tambah">
            <Plus size={20} />
          </button>
        }
      />

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="bg-wine-50 dark:bg-wine-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-wine-600"><ArrowUpRight size={14} /> Hutang (saya pinjam)</span>
          <Amount value={totals.hutang} className="mt-1 block text-lg font-extrabold text-wine-600" />
        </Card>
        <Card className="bg-sage-50 dark:bg-sage-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-sage-700"><ArrowDownLeft size={14} /> Piutang (orang pinjam)</span>
          <Amount value={totals.piutang} className="mt-1 block text-lg font-extrabold text-sage-700" />
        </Card>
      </div>

      {/* Tab */}
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-card dark:bg-gray-900">
        {(['hutang', 'piutang'] as DebtType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={clsx('flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition', tab === t ? 'bg-maroon-700 text-white' : 'text-gray-500')}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada {tab}.</p>
      ) : (
        <div className="space-y-3">
          {list.map((d) => {
            const sisa = d.amount - d.paid_amount
            const ratio = d.amount > 0 ? d.paid_amount / d.amount : 0
            const lunas = d.status === 'lunas'
            return (
              <Card key={d.id} className={clsx(lunas && 'opacity-60')}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{d.person}</p>
                    {d.note && <p className="text-xs text-gray-400">{d.note}</p>}
                    {d.due_date && <p className="text-xs text-gray-400">Jatuh tempo {formatTanggalPanjang(d.due_date)}</p>}
                  </div>
                  <div className="text-right">
                    <Amount value={d.amount} className="block text-sm font-bold" />
                    {!lunas && <span className="nums text-xs text-gray-400">sisa {formatRupiah(sisa)}</span>}
                    {lunas && <span className="flex items-center justify-end gap-0.5 text-xs font-semibold text-sage-600"><Check size={12} /> Lunas</span>}
                  </div>
                </div>
                {!lunas && <ProgressBar ratio={ratio} />}
                <div className="mt-2 flex gap-2">
                  {!lunas && (
                    <button
                      onClick={() => {
                        setPayTarget(d)
                        setPayAmount(String(sisa))
                        setRecordTx(true)
                      }}
                      className="flex-1 rounded-xl bg-maroon-700 py-1.5 text-xs font-semibold text-white"
                    >
                      {d.type === 'hutang' ? 'Bayar' : 'Terima'}
                    </button>
                  )}
                  <button onClick={() => confirm('Hapus catatan ini?') && remove.mutate(d.id)} className="flex-1 rounded-xl bg-wine-50 py-1.5 text-xs font-medium text-wine-500 dark:bg-wine-500/10">
                    Hapus
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sheet tambah */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Tambah ${tab}`}>
        <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Nama orang" className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800" />
        <input inputMode="numeric" value={amount ? formatRupiah(parseRupiah(amount), false) : ''} onChange={(e) => setAmount(e.target.value)} placeholder="Nominal" className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800" />
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Jatuh tempo</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Dompet</span>
            <select value={walletId ?? ''} onChange={(e) => setWalletId(e.target.value || null)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
              <option value="">— pilih —</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" className="mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800" />
        <button onClick={handleCreate} className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft">Simpan</button>
      </Sheet>

      {/* Sheet bayar */}
      <Sheet open={!!payTarget} onClose={() => setPayTarget(null)} title={payTarget?.type === 'hutang' ? 'Bayar Hutang' : 'Terima Piutang'}>
        <p className="mb-2 text-center text-sm text-gray-400">{payTarget?.person}</p>
        <input inputMode="numeric" value={payAmount ? formatRupiah(parseRupiah(payAmount), false) : ''} onChange={(e) => setPayAmount(e.target.value)} className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800" />
        <button onClick={() => setRecordTx((v) => !v)} className={clsx('mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm', recordTx ? 'bg-dusty-100 text-dusty-600 dark:bg-dusty-500/10' : 'bg-gray-100 text-gray-500 dark:bg-gray-800')}>
          <span>Catat otomatis ke transaksi {payTarget?.wallet_id ? '' : '(pilih dompet dulu di catatan)'}</span>
          <span className={clsx('h-5 w-9 rounded-full p-0.5 transition', recordTx ? 'bg-dusty-500' : 'bg-gray-300 dark:bg-gray-600')}>
            <span className={clsx('block h-4 w-4 rounded-full bg-white transition', recordTx && 'translate-x-4')} />
          </span>
        </button>
        <button onClick={handlePay} className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft">Simpan</button>
      </Sheet>
    </div>
  )
}
