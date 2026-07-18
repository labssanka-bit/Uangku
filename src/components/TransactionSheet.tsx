import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, Repeat, Camera, Mic, Loader2, ImageIcon } from 'lucide-react'
import { Sheet } from './ui/Sheet'
import { Numpad } from './ui/Numpad'
import { CategoryIcon } from './ui/CategoryIcon'
import { useCategories } from '@/hooks/useCategories'
import { useTransactionMutations } from '@/hooks/useTransactions'
import { useWallets } from '@/hooks/useWallets'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { formatRupiah, parseRupiah, toISODate } from '@/lib/format'
import { parseReceipt, uploadReceipt, parseVoiceAudio } from '@/lib/receipt'
import {
  listenOnce,
  isWebSpeechSupported,
  isRecordingSupported,
  recordAudio,
  blobToBase64,
  type RecordedAudio,
} from '@/lib/voice'
import { extractAmount, guessCategoryName } from '@/lib/parseAmount'
import { isDemo } from '@/lib/demo'
import { clsx } from '@/lib/clsx'
import type { Transaction, TxType, ReceiptItem } from '@/types'

import type { AddPreset } from '@/store/uiStore'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
  preset?: AddPreset | null
}

export function TransactionSheet({ open, onClose, editing, preset }: Props) {
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [date, setDate] = useState(toISODate(new Date()))
  const [note, setNote] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [merchant, setMerchant] = useState<string | null>(null)
  const [items, setItems] = useState<ReceiptItem[] | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'ocr' | 'voice' | 'recording'>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<{ stop: () => Promise<RecordedAudio> } | null>(null)

  const { user } = useAuth()
  const { data: profile } = useProfile()
  const reasons = profile?.spending_reasons ?? []
  const { data: categories = [] } = useCategories(type)
  const { data: wallets = [] } = useWallets()
  const { create, update, remove } = useTransactionMutations()

  useEffect(() => {
    if (!open) return
    setHint(null)
    setSaveError(null)
    if (editing) {
      setType(editing.type)
      setAmount(editing.amount)
      setCategoryId(editing.category_id)
      setWalletId(editing.wallet_id)
      setDate(editing.date)
      setNote(editing.note ?? '')
      setRecurring(editing.is_recurring)
      setReceiptUrl(editing.receipt_url)
      setMerchant(editing.merchant)
      setItems(editing.items)
      setReason(editing.reason ?? null)
    } else {
      setType(preset?.type ?? 'expense')
      setAmount(0)
      setCategoryId(preset?.category_id ?? null)
      setWalletId(null)
      setDate(toISODate(new Date()))
      setNote(preset?.note ?? '')
      setRecurring(false)
      setReceiptUrl(null)
      setMerchant(null)
      setItems(null)
      setReason(null)
    }
  }, [open, editing, preset])

  const resolvedCategoryId = useMemo(() => {
    if (categoryId && categories.some((c) => c.id === categoryId)) return categoryId
    return categories[0]?.id ?? null
  }, [categoryId, categories])

  const resolvedWalletId = useMemo(() => {
    if (walletId && wallets.some((w) => w.id === walletId)) return walletId
    const def = wallets.find((w) => w.is_default && w.group === 'cashflow')
    return def?.id ?? wallets[0]?.id ?? null
  }, [walletId, wallets])

  function applyGuessedCategory(name: string | null) {
    if (!name) return
    const cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (cat) setCategoryId(cat.id)
  }

  async function handleReceipt(file: File) {
    if (isDemo()) { setHint('Mode demo: foto struk AI aktif setelah daftar 😊'); return }
    setBusy('ocr')
    setHint('Membaca struk dengan AI…')
    try {
      const catNames = categories.map((c) => c.name)
      const res = await parseReceipt(file, catNames)
      if (res.total > 0) setAmount(res.total)
      if (res.date) setDate(res.date)
      if (res.merchant) {
        setMerchant(res.merchant)
        setNote((n) => n || res.merchant)
      }
      if (res.items.length) setItems(res.items)
      applyGuessedCategory(res.category ?? guessCategoryName(res.merchant))
      if (user) {
        const url = await uploadReceipt(file, user.id)
        if (url) setReceiptUrl(url)
      }
      setHint(
        res.total > 0
          ? `${res.merchant || 'Struk'} · ${formatRupiah(res.total)} · ${res.items.length} item. Cek & simpan.`
          : 'Struk tak terbaca jelas, isi manual.'
      )
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Gagal membaca struk.')
    } finally {
      setBusy(null)
    }
  }

  async function handleVoice() {
    // Sedang merekam (mode iOS/Gemini) → tap kedua = berhenti & proses
    if (busy === 'recording' && recorderRef.current) {
      await finishRecording()
      return
    }
    if (busy !== null) return
    if (isDemo()) { setHint('Mode demo: input suara aktif setelah daftar 😊'); return }

    // Metode 1 — Chrome: Web Speech API (instan, gratis, on-device)
    if (isWebSpeechSupported()) {
      setBusy('voice')
      setHint('Mendengarkan… ucapkan, mis. "kopi tiga puluh ribu"')
      try {
        const text = await listenOnce()
        applyVoiceText(text)
      } catch (e) {
        setHint(e instanceof Error ? e.message : 'Gagal merekam.')
      } finally {
        setBusy(null)
      }
      return
    }

    // Metode 2 — iOS/Safari: rekam audio → kirim ke Gemini
    if (isRecordingSupported()) {
      try {
        recorderRef.current = await recordAudio(12_000)
        setBusy('recording')
        setHint('🔴 Merekam… ketuk lagi untuk berhenti (maks 12 detik)')
      } catch (e) {
        setHint(e instanceof Error ? e.message : 'Gagal mengakses mikrofon.')
        setBusy(null)
      }
      return
    }

    setHint('Perangkat tidak mendukung input suara.')
  }

  // Set teks dari Web Speech ke form
  function applyVoiceText(text: string) {
    const amt = extractAmount(text)
    if (amt > 0) setAmount(amt)
    if (text) setNote((n) => n || text)
    applyGuessedCategory(guessCategoryName(text))
    setHint(amt > 0 ? `"${text}" → ${formatRupiah(amt)}` : `"${text}". Nominal tak terbaca, isi manual.`)
  }

  // Berhenti merekam → kirim audio ke Gemini
  async function finishRecording() {
    const recorder = recorderRef.current
    recorderRef.current = null
    if (!recorder) return
    setBusy('voice')
    setHint('Memproses suara dengan AI…')
    try {
      const { blob, mimeType } = await recorder.stop()
      const audioBase64 = await blobToBase64(blob)
      const catNames = categories.map((c) => c.name)
      const res = await parseVoiceAudio(audioBase64, mimeType, catNames)
      if (res.type) setType(res.type)
      if (res.amount > 0) setAmount(res.amount)
      if (res.text) setNote((n) => n || res.text)
      applyGuessedCategory(res.category ?? guessCategoryName(res.text))
      setHint(
        res.amount > 0
          ? `"${res.text}" → ${formatRupiah(res.amount)}. Cek & simpan.`
          : `"${res.text || 'Tak terdengar'}". Nominal tak terbaca, isi manual.`
      )
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Gagal memproses suara.')
    } finally {
      setBusy(null)
    }
  }

  const errMsg = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message : (e as { message?: string })?.message || fallback

  const handleDigit = (d: string) => setAmount((a) => Number(`${a}${d}`.slice(0, 13)))
  const handleBackspace = () => setAmount((a) => Math.floor(a / 10))

  const canSave = amount > 0
  const saving = create.isPending || update.isPending

  async function handleSave() {
    if (!canSave) return
    setSaveError(null)
    const payload = {
      category_id: resolvedCategoryId,
      amount,
      type,
      note: note.trim() || null,
      date,
      is_recurring: recurring,
      wallet_id: resolvedWalletId,
      receipt_url: receiptUrl,
      merchant,
      items,
      reason: type === 'expense' ? reason : null,
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (e) {
      setSaveError(errMsg(e, 'Gagal menyimpan transaksi.'))
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('Hapus transaksi ini?')) return
    try {
      await remove.mutateAsync(editing.id)
      onClose()
    } catch (e) {
      setSaveError(errMsg(e, 'Gagal menghapus transaksi.'))
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'}>
      {/* Sticky: type toggle + nominal — tetap terlihat saat scroll ke bawah */}
      <div className="sticky top-0 z-10 -mx-5 border-b border-gray-100 bg-white px-5 pb-3 pt-1 dark:border-gray-800 dark:bg-[#221519]">
        <div className="flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
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
        {/* Nominal: bisa DIKETIK keyboard (PC/HP) atau lewat Numpad di bawah */}
        <div className={clsx('mt-3 flex items-center justify-center gap-1', type === 'income' ? 'text-sage-600' : 'text-wine-500')}>
          <span className="text-2xl font-bold opacity-70">Rp</span>
          <input
            inputMode="numeric"
            value={amount ? formatRupiah(amount, false) : ''}
            onChange={(e) => setAmount(parseRupiah(e.target.value.slice(0, 17)))}
            placeholder="0"
            aria-label="Nominal"
            className="nums w-full max-w-[75%] bg-transparent text-center text-4xl font-extrabold outline-none placeholder:opacity-40"
          />
        </div>
      </div>

      {/* Foto struk & Suara */}
      <div className="mt-4 mb-2 flex gap-2">
        {/* Kamera (ambil foto langsung) */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleReceipt(f)
            e.target.value = ''
          }}
        />
        {/* Galeri (pilih dari galeri) */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleReceipt(f)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-dusty-100 py-2.5 text-sm font-semibold text-maroon-700 disabled:opacity-50 dark:bg-dusty-500/10 dark:text-dusty-300"
        >
          {busy === 'ocr' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} Kamera
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-dusty-100 py-2.5 text-sm font-semibold text-maroon-700 disabled:opacity-50 dark:bg-dusty-500/10 dark:text-dusty-300"
        >
          <ImageIcon size={16} /> Galeri
        </button>
        <button
          onClick={handleVoice}
          disabled={busy === 'ocr' || busy === 'voice'}
          className={clsx(
            'flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold disabled:opacity-50',
            busy === 'recording'
              ? 'animate-pulse bg-wine-500 text-white'
              : 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/10 dark:text-dusty-300'
          )}
        >
          {busy === 'voice' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Mic size={16} />
          )}{' '}
          {busy === 'recording' ? 'Berhenti' : 'Suara'}
        </button>
      </div>
      {hint && <p className="mb-3 text-center text-xs text-gray-500">{hint}</p>}

      {/* Rincian item hasil struk */}
      {items && items.length > 0 && (
        <div className="mb-4 rounded-2xl bg-dusty-50 p-3 dark:bg-gray-800">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-maroon-700 dark:text-dusty-300">
              🧾 {items.length} item{merchant ? ` · ${merchant}` : ''}
            </span>
            <button onClick={() => setItems(null)} className="text-xs text-gray-400">hapus rincian</button>
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto no-scrollbar">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {it.qty && it.qty > 1 ? `${it.qty}× ` : ''}{it.name}
                </span>
                <span className="nums ml-2 shrink-0 text-gray-500">{formatRupiah(it.price)}</span>
                <button
                  onClick={() => setItems((prev) => (prev ? prev.filter((_, j) => j !== i) : prev))}
                  className="ml-2 text-gray-300 hover:text-wine-500"
                  aria-label="Hapus item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kategori */}
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

      {/* Keterangan Belanja (alasan) — hanya untuk Pengeluaran */}
      {type === 'expense' && reasons.length > 0 && (
        <>
          <p className="mb-2 text-xs font-medium text-gray-400">Keterangan Belanja <span className="text-gray-300">(opsional)</span></p>
          <div className="no-scrollbar mb-4 flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason((cur) => (cur === r ? null : r))}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  reason === r ? 'bg-maroon-700 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Dompet */}
      {wallets.length > 0 && (
        <>
          <p className="mb-2 text-xs font-medium text-gray-400">Dompet</p>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
            {wallets.map((w) => (
              <button
                key={w.id}
                onClick={() => setWalletId(w.id)}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition',
                  resolvedWalletId === w.id
                    ? 'bg-maroon-700 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                <CategoryIcon icon={w.icon} color={resolvedWalletId === w.id ? '#ffffff' : w.color} size="sm" />
                <span className="text-xs font-medium">{w.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

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

      {/* Berulang */}
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

      {saveError && (
        <p className="mt-3 rounded-xl bg-wine-50 px-3 py-2 text-center text-xs text-wine-600 dark:bg-wine-500/10">
          {saveError}
        </p>
      )}

      {/* Sticky footer: tombol Simpan selalu terlihat, tak perlu scroll cari */}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-[calc(1.5rem+env(safe-area-inset-bottom))] mt-3 flex gap-2 border-t border-gray-100 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 dark:border-gray-800 dark:bg-[#221519]">
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
