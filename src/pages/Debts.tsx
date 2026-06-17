import { useMemo, useState } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight, Check, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
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

type TabType = DebtType | 'cicilan'

// ─── Cicilan amortisasi ──────────────────────────────────────────────────────
function calcInstallment(principal: number, annualRatePct: number, months: number) {
  if (months <= 0 || principal <= 0) return { monthly: 0, total: 0, interest: 0, schedule: [] }
  const r = annualRatePct / 100 / 12
  const monthly =
    r === 0
      ? principal / months
      : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const total = monthly * months
  const interest = total - principal
  const schedule: { bulan: number; cicilan: number; pokok: number; bunga: number; sisa: number }[] = []
  let sisa = principal
  for (let i = 1; i <= months; i++) {
    const bungaBulan = sisa * r
    const pokokBulan = monthly - bungaBulan
    sisa = Math.max(0, sisa - pokokBulan)
    schedule.push({ bulan: i, cicilan: monthly, pokok: pokokBulan, bunga: bungaBulan, sisa })
  }
  return { monthly, total, interest, schedule }
}

export function Debts() {
  const { data: debts = [] } = useDebts()
  const { data: wallets = [] } = useWallets()
  const { create, update, remove, pay } = useDebtMutations()

  const [tab, setTab] = useState<TabType>('hutang')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Debt | null>(null)
  const [payTarget, setPayTarget] = useState<Debt | null>(null)

  // Form tambah/edit hutang-piutang
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [walletId, setWalletId] = useState<string | null>(null)
  const [formType, setFormType] = useState<DebtType>('hutang')

  // Form bayar
  const [payAmount, setPayAmount] = useState('')
  const [recordTx, setRecordTx] = useState(true)

  // Cicilan simulator
  const [cicilanName, setCicilanName] = useState('')
  const [cicilanPrincipal, setCicilanPrincipal] = useState('')
  const [cicilanRate, setCicilanRate] = useState('12')
  const [cicilanTenor, setCicilanTenor] = useState('12')
  const [showSchedule, setShowSchedule] = useState(false)

  const totals = useMemo(() => {
    let hutang = 0, piutang = 0
    for (const d of debts) {
      if (d.status === 'lunas') continue
      const sisa = d.amount - d.paid_amount
      if (d.type === 'hutang') hutang += sisa
      else piutang += sisa
    }
    return { hutang, piutang }
  }, [debts])

  const list = (tab === 'cicilan' ? [] : debts.filter((d) => d.type === tab)) as Debt[]

  function openAdd() {
    setEditTarget(null)
    setPerson('')
    setAmount('')
    setDueDate('')
    setNote('')
    setWalletId(null)
    setFormType(tab === 'cicilan' ? 'hutang' : tab as DebtType)
    setAddOpen(true)
  }

  function openEdit(d: Debt) {
    setEditTarget(d)
    setPerson(d.person)
    setAmount(String(d.amount))
    setDueDate(d.due_date ?? '')
    setNote(d.note ?? '')
    setWalletId(d.wallet_id)
    setFormType(d.type)
    setAddOpen(true)
  }

  async function handleSave() {
    const amt = parseRupiah(amount)
    if (!person.trim() || amt <= 0) return
    const payload = {
      person: person.trim(),
      amount: amt,
      type: formType,
      due_date: dueDate || null,
      note: note.trim() || null,
      wallet_id: walletId,
    }
    if (editTarget) {
      await update.mutateAsync({ id: editTarget.id, ...payload })
    } else {
      await create.mutateAsync(payload)
    }
    setAddOpen(false)
  }

  async function handlePay() {
    if (!payTarget) return
    const amt = parseRupiah(payAmount)
    if (amt <= 0) return
    await pay.mutateAsync({ debt: payTarget, payAmount: amt, recordTx })
    setPayTarget(null)
    setPayAmount('')
  }

  // Cicilan
  const cicilanP = parseRupiah(cicilanPrincipal)
  const cicilanR = parseFloat(cicilanRate) || 0
  const cicilanN = parseInt(cicilanTenor) || 0
  const { monthly, total: cicilanTotal, interest: cicilanInterest, schedule } = calcInstallment(cicilanP, cicilanR, cicilanN)

  async function saveCicilanAsHutang() {
    if (!cicilanName.trim() || cicilanP <= 0) return
    await create.mutateAsync({
      person: cicilanName.trim(),
      amount: cicilanP,
      type: 'hutang',
      due_date: null,
      note: `Cicilan ${cicilanN} bulan · ${cicilanR}%/thn · ${formatRupiah(monthly)}/bln`,
      wallet_id: null,
    })
    alert('Disimpan sebagai hutang!')
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'hutang', label: 'Hutang' },
    { key: 'piutang', label: 'Piutang' },
    { key: 'cicilan', label: '🧮 Cicilan' },
  ]

  return (
    <div className="px-4 pt-5">
      <PageHeader
        title="Hutang & Piutang"
        action={
          tab !== 'cicilan' && (
            <button onClick={openAdd} className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-700 text-white shadow-card" aria-label="Tambah">
              <Plus size={20} />
            </button>
          )
        }
      />

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="bg-wine-50 dark:bg-wine-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-wine-600"><ArrowUpRight size={14} /> Hutang</span>
          <Amount value={totals.hutang} className="mt-1 block text-lg font-extrabold text-wine-600" />
        </Card>
        <Card className="bg-sage-50 dark:bg-sage-500/10">
          <span className="flex items-center gap-1 text-xs font-medium text-sage-700"><ArrowDownLeft size={14} /> Piutang</span>
          <Amount value={totals.piutang} className="mt-1 block text-lg font-extrabold text-sage-700" />
        </Card>
      </div>

      {/* Tab */}
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-card dark:bg-gray-900">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx('flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition', tab === t.key ? 'bg-maroon-700 text-white' : 'text-gray-500')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cicilan Simulator ── */}
      {tab === 'cicilan' && (
        <div className="space-y-3">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Calculator size={16} className="text-maroon-700" />
              <span className="font-bold">Simulasi Cicilan</span>
            </div>
            <input
              value={cicilanName}
              onChange={(e) => setCicilanName(e.target.value)}
              placeholder="Nama pinjaman (mis. KPR BCA)"
              className="mb-3 w-full rounded-xl bg-gray-100 px-3 py-2 text-sm outline-none dark:bg-gray-800"
            />
            <label className="mb-3 block">
              <span className="text-xs text-gray-400">Pokok pinjaman (Rp)</span>
              <input
                inputMode="numeric"
                value={cicilanPrincipal ? formatRupiah(parseRupiah(cicilanPrincipal), false) : ''}
                onChange={(e) => setCicilanPrincipal(e.target.value)}
                placeholder="0"
                className="nums mt-1 w-full rounded-xl bg-gray-100 px-3 py-3 text-center text-xl font-bold outline-none dark:bg-gray-800"
              />
            </label>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Bunga / tahun (%)</span>
                <input
                  inputMode="decimal"
                  value={cicilanRate}
                  onChange={(e) => setCicilanRate(e.target.value)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Tenor (bulan)</span>
                <input
                  inputMode="numeric"
                  value={cicilanTenor}
                  onChange={(e) => setCicilanTenor(e.target.value)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800"
                />
              </label>
            </div>

            {monthly > 0 && (
              <div className="mb-4 rounded-2xl bg-dusty-50 p-4 dark:bg-dusty-500/10">
                <p className="mb-2 text-center text-xs font-medium text-gray-400">Hasil Simulasi</p>
                <p className="nums text-center text-3xl font-extrabold text-maroon-700">{formatRupiah(monthly)}</p>
                <p className="text-center text-xs text-gray-400">/bulan</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white p-2 dark:bg-gray-900">
                    <p className="text-gray-400">Total Bayar</p>
                    <p className="nums font-bold">{formatRupiah(cicilanTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-wine-50 p-2 dark:bg-wine-500/10">
                    <p className="text-gray-400">Total Bunga</p>
                    <p className="nums font-bold text-wine-600">{formatRupiah(cicilanInterest)}</p>
                  </div>
                </div>
              </div>
            )}

            {schedule.length > 0 && (
              <>
                <button
                  onClick={() => setShowSchedule((v) => !v)}
                  className="mb-3 flex w-full items-center justify-between rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium dark:bg-gray-800"
                >
                  <span>Tabel Amortisasi ({schedule.length} bulan)</span>
                  {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showSchedule && (
                  <div className="mb-3 max-h-60 overflow-y-auto rounded-xl bg-gray-50 dark:bg-gray-800 no-scrollbar">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-400">Bln</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-400">Cicilan</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-400">Pokok</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-400">Bunga</th>
                          <th className="px-2 py-1.5 text-right font-medium text-gray-400">Sisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((row) => (
                          <tr key={row.bulan} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="px-2 py-1.5 text-gray-500">{row.bulan}</td>
                            <td className="nums px-2 py-1.5 text-right">{formatRupiah(row.cicilan)}</td>
                            <td className="nums px-2 py-1.5 text-right text-sage-600">{formatRupiah(row.pokok)}</td>
                            <td className="nums px-2 py-1.5 text-right text-wine-500">{formatRupiah(row.bunga)}</td>
                            <td className="nums px-2 py-1.5 text-right text-gray-500">{formatRupiah(row.sisa)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <button
              onClick={saveCicilanAsHutang}
              disabled={cicilanP <= 0 || !cicilanName.trim()}
              className="w-full rounded-2xl bg-maroon-700 py-2.5 text-sm font-bold text-white shadow-soft disabled:opacity-40"
            >
              Simpan sebagai Hutang
            </button>
          </Card>
        </div>
      )}

      {/* ── Hutang / Piutang List ── */}
      {tab !== 'cicilan' && (
        list.length === 0 ? (
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
                        onClick={() => { setPayTarget(d); setPayAmount(String(sisa)); setRecordTx(true) }}
                        className="flex-1 rounded-xl bg-maroon-700 py-1.5 text-xs font-semibold text-white"
                      >
                        {d.type === 'hutang' ? 'Bayar' : 'Terima'}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(d)}
                      className="flex-1 rounded-xl bg-dusty-50 py-1.5 text-xs font-medium text-maroon-700 dark:bg-dusty-500/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirm('Hapus catatan ini?') && remove.mutate(d.id)}
                      className="flex-1 rounded-xl bg-wine-50 py-1.5 text-xs font-medium text-wine-500 dark:bg-wine-500/10"
                    >
                      Hapus
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* Sheet tambah/edit */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={editTarget ? 'Edit Hutang/Piutang' : `Tambah ${formType}`}>
        {/* Toggle hutang/piutang (hanya saat tambah baru) */}
        {!editTarget && (
          <div className="mb-3 flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
            {(['hutang', 'piutang'] as DebtType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFormType(t)}
                className={clsx('flex-1 rounded-xl py-2 text-sm font-semibold capitalize', formType === t ? 'bg-maroon-700 text-white' : 'text-gray-500')}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <input
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Nama orang / lembaga"
          className="mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
        />
        <input
          inputMode="numeric"
          value={amount ? formatRupiah(parseRupiah(amount), false) : ''}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nominal"
          className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Jatuh tempo</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">Dompet (untuk auto-catat bayar)</span>
            <select value={walletId ?? ''} onChange={(e) => setWalletId(e.target.value || null)} className="rounded-xl bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800">
              <option value="">— tanpa dompet —</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
        </div>
        <p className="mb-2 -mt-1 text-xs text-gray-400">
          ℹ️ Dompet opsional: jika diisi, bayar/terima otomatis tercatat sebagai transaksi di dompet tersebut.
        </p>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" className="mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800" />
        <button onClick={handleSave} className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft">
          {editTarget ? 'Update' : 'Simpan'}
        </button>
      </Sheet>

      {/* Sheet bayar */}
      <Sheet open={!!payTarget} onClose={() => setPayTarget(null)} title={payTarget?.type === 'hutang' ? 'Bayar Hutang' : 'Terima Piutang'}>
        <p className="mb-2 text-center text-sm text-gray-400">{payTarget?.person}</p>
        <input
          inputMode="numeric"
          value={payAmount ? formatRupiah(parseRupiah(payAmount), false) : ''}
          onChange={(e) => setPayAmount(e.target.value)}
          className="nums mb-3 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />
        <button
          onClick={() => setRecordTx((v) => !v)}
          className={clsx('mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm', recordTx ? 'bg-dusty-100 text-dusty-600 dark:bg-dusty-500/10' : 'bg-gray-100 text-gray-500 dark:bg-gray-800')}
        >
          <span>Catat otomatis ke transaksi{!payTarget?.wallet_id ? ' (pilih dompet di edit)' : ''}</span>
          <span className={clsx('h-5 w-9 rounded-full p-0.5 transition', recordTx ? 'bg-dusty-500' : 'bg-gray-300 dark:bg-gray-600')}>
            <span className={clsx('block h-4 w-4 rounded-full bg-white transition', recordTx && 'translate-x-4')} />
          </span>
        </button>
        <button onClick={handlePay} className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft">Simpan</button>
      </Sheet>
    </div>
  )
}
