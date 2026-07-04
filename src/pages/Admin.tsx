import { useState } from 'react'
import { MessageCircle, Users, KeyRound, Copy, Plus, Loader2, ShieldCheck, RefreshCw, Trash2, UserPlus, UserCheck, RotateCcw, Search, X, Mail, Send } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useProfile } from '@/hooks/useProfile'
import { useAdminOverview, useGenerateCodes, useDeleteUser, useReserveCode, useUnreserveCode, useSendCodeEmail } from '@/hooks/useAdminData'
import { AdminChat } from '@/pages/AdminChat'
import { formatTanggal } from '@/lib/format'
import { clsx } from '@/lib/clsx'

type Tab = 'chat' | 'users' | 'codes' | 'email'

export function Admin() {
  const { data: profile } = useProfile()
  const [tab, setTab] = useState<Tab>('chat')

  if (profile && !profile.is_admin) {
    return (
      <div className="px-4 pt-5">
        <PageHeader title="Panel Admin" />
        <p className="py-16 text-center text-sm text-gray-400">Halaman khusus admin.</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'users', label: 'User', icon: Users },
    { id: 'codes', label: 'Kode', icon: KeyRound },
    { id: 'email', label: 'Email', icon: Mail },
  ]

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Panel Admin" />
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-card dark:bg-gray-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx('flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-xs font-semibold transition sm:flex-row sm:gap-1.5 sm:text-sm',
              tab === t.id ? 'bg-maroon-700 text-white' : 'text-gray-500')}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'chat' && <AdminChat embedded />}
      {tab === 'users' && <UsersTab />}
      {tab === 'codes' && <CodesTab />}
      {tab === 'email' && <EmailTab />}
    </div>
  )
}

function fmtBytes(n: number) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n >= 1024) return (n / 1024).toFixed(0) + ' KB'
  return n + ' B'
}
function relTime(iso?: string | null) {
  if (!iso) return null
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} hr lalu`
  return `${Math.floor(day / 30)} bln lalu`
}
function isOnline(last_seen?: string | null) {
  return !!last_seen && Date.now() - new Date(last_seen).getTime() < 3 * 60 * 1000
}

function UsersTab() {
  const { data, isLoading, error } = useAdminOverview(true)
  const del = useDeleteUser()
  if (isLoading) return <Loading />
  if (error) return <ErrMsg msg={(error as Error).message} />
  const users = data?.users ?? []
  const usage = data?.usage
  const onlineCount = users.filter((u) => isOnline(u.last_seen)).length

  async function hapus(id: string, nama: string) {
    if (!confirm(`Hapus akun "${nama}"? Semua data (transaksi, dompet, dll) ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`)) return
    try { await del.mutateAsync(id) } catch (e) { alert((e as Error).message) }
  }

  // Urutkan: online dulu, lalu paling baru aktif
  const sorted = [...users].sort((a, b) => {
    const ta = new Date(a.last_seen ?? a.last_sign_in_at ?? a.created_at).getTime()
    const tb = new Date(b.last_seen ?? b.last_sign_in_at ?? b.created_at).getTime()
    return tb - ta
  })

  return (
    <>
      {/* Kapasitas database */}
      {usage && (() => {
        const ratio = usage.limit_bytes > 0 ? usage.db_bytes / usage.limit_bytes : 0
        const pct = (ratio * 100)
        const warn = ratio > 0.8
        return (
          <Card className={clsx('mb-4', warn && 'bg-wine-50 dark:bg-wine-500/10')}>
            <div className="mb-1 flex items-end justify-between">
              <span className="text-sm font-semibold">Kapasitas Database</span>
              <span className="nums text-sm">
                <b className={warn ? 'text-wine-600' : 'text-maroon-700 dark:text-dusty-200'}>{fmtBytes(usage.db_bytes)}</b>
                <span className="text-gray-400"> / {fmtBytes(usage.limit_bytes)}</span>
              </span>
            </div>
            <ProgressBar ratio={ratio} />
            <p className={clsx('mt-1 text-xs', warn ? 'font-medium text-wine-600' : 'text-gray-400')}>
              {pct.toFixed(1)}% terpakai · {users.length} pengguna · {usage.tx_total} transaksi
              {warn && ' — mendekati batas! Pertimbangkan upgrade atau bersihkan data.'}
            </p>
          </Card>
        )
      })()}

      <p className="mb-3 text-sm text-gray-400">
        {users.length} pengguna · <span className="font-semibold text-sage-600">{onlineCount} online</span>
      </p>
      <div className="space-y-2">
        {sorted.map((u) => {
          const online = isOnline(u.last_seen)
          const lastActive = relTime(u.last_seen)
          const lastLogin = relTime(u.last_sign_in_at)
          return (
            <Card key={u.id} className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-100 font-bold text-maroon-700 dark:bg-maroon-500/20">
                {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                {online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sage-500 dark:border-gray-900" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {u.full_name || 'Pengguna'}
                  {u.is_admin && <ShieldCheck size={14} className="shrink-0 text-sage-600" />}
                </p>
                <p className="truncate text-xs text-gray-400">{u.email}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                  {online
                    ? <span className="font-semibold text-sage-600">🟢 Online sekarang</span>
                    : lastActive
                      ? <span>aktif {lastActive}</span>
                      : lastLogin ? <span>login {lastLogin}</span> : <span>belum pernah aktif</span>}
                  {(u.tx_count ?? 0) > 0 && <span>· {u.tx_count} tx · {fmtBytes(u.est_bytes ?? 0)}</span>}
                </p>
                <p className="mt-0.5 text-[11px]">
                  {u.code
                    ? <span className="nums rounded bg-dusty-100 px-1.5 py-0.5 font-semibold tracking-wider text-maroon-700 dark:bg-dusty-500/15 dark:text-dusty-200">🔑 {u.code}</span>
                    : <span className="text-gray-400">{u.is_admin ? 'admin (tanpa kode)' : 'tanpa kode'}</span>}
                  <span className="ml-2 text-gray-400">daftar {formatTanggal(u.created_at)}</span>
                </p>
              </div>
              {!u.is_admin && (
                <button
                  onClick={() => hapus(u.id, u.full_name || u.email || 'Pengguna')}
                  disabled={del.isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-xl bg-wine-50 text-wine-500 disabled:opacity-50 dark:bg-wine-500/10"
                  aria-label="Hapus akun"
                >
                  {del.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}

function CodesTab() {
  const { data, isLoading, error, refetch, isFetching } = useAdminOverview(true)
  const gen = useGenerateCodes()
  const reserve = useReserveCode()
  const unreserve = useUnreserveCode()
  const [count, setCount] = useState('30')
  const [justGen, setJustGen] = useState<string[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [reserveFor, setReserveFor] = useState<string | null>(null)
  const [reserveLabel, setReserveLabel] = useState('')

  async function doGen() {
    const n = parseInt(count) || 0
    if (n < 1) return
    const res = await gen.mutateAsync(n)
    setJustGen(res.generated)
  }

  const copy = (txt: string) => navigator.clipboard?.writeText(txt)

  function tandaiDikasih(code: string) {
    setReserveLabel('')
    setReserveFor(code)
  }

  async function submitReserve() {
    const code = reserveFor
    const lbl = reserveLabel.trim()
    if (!code || !lbl) return
    setBusy(code)
    try {
      await reserve.mutateAsync({ code, label: lbl })
      copy(code)
      setReserveFor(null)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function batalDikasih(code: string) {
    if (!confirm(`Batalkan tanda "sudah dikasih" untuk ${code}? Kode kembali ke daftar Tersedia.`)) return
    setBusy(code)
    try { await unreserve.mutateAsync(code) }
    catch (e) { alert((e as Error).message) }
    finally { setBusy(null) }
  }

  if (isLoading) return <Loading />
  if (error) return <ErrMsg msg={(error as Error).message} />
  const c = data!.codes
  const ql = q.trim().toLowerCase()
  const match = (code: string, label?: string | null) =>
    code.toLowerCase().includes(ql) || (label ?? '').toLowerCase().includes(ql)
  const unusedFiltered = ql ? c.unused.filter((k) => match(k.code)) : c.unused
  const reservedFiltered = ql ? (c.reserved ?? []).filter((k) => match(k.code, k.reserved_email)) : (c.reserved ?? [])
  const unusedList = unusedFiltered.map((x) => x.code)
  const reservedList = reservedFiltered

  return (
    <>
      {/* Statistik */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <StatBox label="Tersedia" value={c.unusedCount} hl />
        <StatBox label="Sudah dikasih (tunggu dipakai)" value={c.reservedCount ?? 0} />
        <StatBox label="Terpakai" value={c.used} />
        <StatBox label="Total" value={c.total} />
      </div>

      {/* Generate */}
      <Card className="mb-4">
        <p className="mb-2 text-sm font-semibold">Generate Kode Baru</p>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={count}
            onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))}
            className="w-24 rounded-xl bg-gray-100 px-3 py-2 text-center text-sm font-bold outline-none dark:bg-gray-800"
          />
          <button
            onClick={doGen}
            disabled={gen.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-maroon-700 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {gen.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Generate & Simpan ke DB
          </button>
        </div>
        {justGen && justGen.length > 0 && (
          <div className="mt-3 rounded-xl bg-sage-50 p-3 dark:bg-sage-500/10">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-sage-700">✅ {justGen.length} kode baru dibuat</span>
              <button onClick={() => copy(justGen.join('\n'))} className="flex items-center gap-1 text-xs font-semibold text-maroon-700"><Copy size={12} /> Salin</button>
            </div>
            <div className="nums max-h-32 overflow-y-auto whitespace-pre-line text-xs text-gray-600 no-scrollbar dark:text-gray-300">{justGen.join('\n')}</div>
          </div>
        )}
      </Card>

      {/* Cari kode / penerima */}
      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kode atau nama/no WA…"
          className="w-full rounded-xl bg-gray-100 py-2.5 pl-9 pr-9 text-sm outline-none dark:bg-gray-800"
        />
        {q && (
          <button onClick={() => setQ('')} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Bersihkan">
            <X size={14} />
          </button>
        )}
      </div>
      {ql && (
        <p className="-mt-2 mb-3 text-center text-[11px] text-gray-400">
          {unusedFiltered.length + reservedFiltered.length} kode cocok “{q}”
        </p>
      )}

      {/* Sudah dikasih ke calon pembeli (menunggu dipakai) */}
      {reservedList.length > 0 && (
        <>
          <h2 className="mb-2 font-bold">Sudah Dikasih — Tunggu Dipakai ({reservedList.length})</h2>
          <Card className="mb-4 p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {reservedList.map((k) => (
                <div key={k.code} className="flex items-center gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <button onClick={() => copy(k.code)} className="nums flex items-center gap-1 font-semibold tracking-wider text-maroon-700 dark:text-dusty-200">
                      {k.code} <Copy size={12} className="text-gray-300" />
                    </button>
                    <p className="truncate text-xs text-gray-500">
                      <UserCheck size={11} className="mr-1 inline text-amber-500" />
                      {k.reserved_email}
                      {k.reserved_at && <span className="ml-1 text-gray-400">· {formatTanggal(k.reserved_at)}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => batalDikasih(k.code)}
                    disabled={busy === k.code}
                    className="flex h-8 items-center gap-1 rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-500 disabled:opacity-50 dark:bg-gray-800"
                  >
                    {busy === k.code ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Batal
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Daftar tersedia */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Kode Tersedia ({ql ? `${unusedFiltered.length} dari ${c.unusedCount}` : c.unusedCount})</h2>
        <div className="flex gap-3">
          <button onClick={() => copy(unusedList.join('\n'))} className="flex items-center gap-1 text-sm font-semibold text-maroon-700"><Copy size={14} /> Salin semua</button>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-sm text-gray-400"><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /></button>
        </div>
      </div>
      <Card className="p-0">
        <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto no-scrollbar dark:divide-gray-800">
          {unusedList.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              {ql ? `Tak ada kode tersedia yang cocok “${q}”.` : 'Tak ada kode tersedia. Generate baru di atas.'}
            </p>
          )}
          {unusedFiltered.map((k) => (
            <div key={k.code} className="flex items-center gap-2 px-4 py-3">
              <button onClick={() => copy(k.code)} className="nums flex flex-1 items-center gap-1.5 text-left font-semibold tracking-wider text-maroon-700 dark:text-dusty-200">
                {k.code} <Copy size={13} className="text-gray-300" />
              </button>
              <button
                onClick={() => tandaiDikasih(k.code)}
                disabled={busy === k.code}
                className="flex h-8 items-center gap-1 rounded-lg bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 disabled:opacity-50 dark:bg-amber-500/15"
              >
                {busy === k.code ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Tandai dikasih
              </button>
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-center text-[11px] text-gray-400">
        Ketuk kode = salin. “Tandai dikasih” = catat kamu sudah kirim kode itu ke calon pembeli (biar tak dobel), kode langsung tersalin. Otomatis jadi “Terpakai” saat mereka daftar.
      </p>

      {/* Modal Tandai Dikasih */}
      <Sheet open={!!reserveFor} onClose={() => setReserveFor(null)} title="Tandai Sudah Dikasih">
        <div className="mb-4 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
            <UserPlus size={22} className="text-amber-600" />
          </div>
          <p className="mt-3 text-sm text-gray-500">Kode akses</p>
          <p className="nums text-lg font-extrabold tracking-wider text-maroon-700 dark:text-dusty-200">{reserveFor}</p>
        </div>

        <label className="mb-1 block text-sm font-semibold">Dikasih ke siapa?</label>
        <input
          autoFocus
          value={reserveLabel}
          onChange={(e) => setReserveLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitReserve() }}
          placeholder="mis. Budi — 0812-3456-7890"
          className="mb-1.5 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm outline-none ring-maroon-500 focus:ring-2 dark:bg-gray-800"
        />
        <p className="mb-4 text-xs text-gray-400">Isi nama atau nomor WA calon pembeli, biar kamu ingat kode ini sudah dikirim ke siapa.</p>

        <div className="flex gap-2">
          <button
            onClick={() => setReserveFor(null)}
            className="flex-1 rounded-2xl bg-gray-100 py-3 font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Batal
          </button>
          <button
            onClick={submitReserve}
            disabled={!reserveLabel.trim() || busy === reserveFor}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft disabled:opacity-50"
          >
            {busy === reserveFor ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
            Simpan & Salin Kode
          </button>
        </div>
      </Sheet>
    </>
  )
}

function buildEmailPreview(nama: string, kode: string) {
  return `Halo ${nama} 👋 Terima kasih sudah membeli Finplan Sanka 🎉

Ini akses seumur hidupmu:

🔑 Kode Akses: ${kode}
🌐 Aplikasi: https://finplansanka.com

Cara aktifkan (1 menit):
1. Buka https://finplansanka.com
2. Tap Daftar
3. Masukkan Kode Akses di atas + email & password kamu
4. Selesai! Langsung bisa dipakai selamanya ✅

Simpan email ini ya, kodenya cuma bisa dipakai 1x untuk buat akun.
Ada kendala? Balas email ini, aku bantu 🙏`
}

function EmailTab() {
  const { data, isLoading, error } = useAdminOverview(true)
  const send = useSendCodeEmail()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState<string | null>(null)

  if (isLoading) return <Loading />
  if (error) return <ErrMsg msg={(error as Error).message} />

  const available = data!.codes.unused
  const selected = code || available[0]?.code || ''
  const preview = buildEmailPreview(nama.trim() || '[nama pembeli]', selected || 'FS-XXXX-XXXX')
  const copy = (t: string) => navigator.clipboard?.writeText(t)

  async function kirim() {
    if (!nama.trim()) { alert('Isi nama pembeli.'); return }
    if (!email.trim() || !email.includes('@')) { alert('Isi email pembeli yang valid.'); return }
    if (!selected) { alert('Tidak ada kode tersedia. Generate dulu di tab Kode.'); return }
    if (!confirm(`Kirim email ke ${email.trim()} berisi kode ${selected}?`)) return
    try {
      await send.mutateAsync({ code: selected, email: email.trim(), name: nama.trim() })
      setSent(email.trim())
      setNama(''); setEmail(''); setCode('')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <>
      <p className="mb-3 text-sm text-gray-400">Kirim kode + cara aktivasi ke email pembeli. Isi nama, email, pilih kode, cek pratinjau, lalu kirim.</p>

      {sent && (
        <div className="mb-4 rounded-2xl bg-sage-50 p-3 text-center text-sm text-sage-700 dark:bg-sage-500/10">
          ✅ Email terkirim ke <b>{sent}</b>. Kode ditandai “sudah dikasih”.
        </div>
      )}

      <Card className="mb-4 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-400">Nama pembeli</span>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="mis. Reza Asqalani"
            className="mt-1 w-full rounded-xl bg-gray-100 px-3 py-2.5 text-sm outline-none dark:bg-gray-800"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400">Email pembeli</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mis. reza@gmail.com"
            className="mt-1 w-full rounded-xl bg-gray-100 px-3 py-2.5 text-sm outline-none dark:bg-gray-800"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-400">Pilih kode ({available.length} tersedia)</span>
          {available.length === 0 ? (
            <p className="mt-1 rounded-xl bg-wine-50 px-3 py-2 text-xs text-wine-600 dark:bg-wine-500/10">Tak ada kode tersedia. Generate dulu di tab Kode.</p>
          ) : (
            <select
              value={selected}
              onChange={(e) => setCode(e.target.value)}
              className="nums mt-1 w-full rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-semibold tracking-wider outline-none dark:bg-gray-800"
            >
              {available.map((k) => (
                <option key={k.code} value={k.code}>{k.code}</option>
              ))}
            </select>
          )}
        </label>
      </Card>

      {/* Pratinjau */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Pratinjau Email</h2>
        <button onClick={() => copy(preview)} className="flex items-center gap-1 text-sm font-semibold text-maroon-700"><Copy size={14} /> Salin teks</button>
      </div>
      <Card className="mb-4 bg-dusty-50 dark:bg-gray-900/60">
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-200">{preview}</p>
      </Card>

      <button
        onClick={kirim}
        disabled={send.isPending || available.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft disabled:opacity-50"
      >
        {send.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        Kirim Email ke Pembeli
      </button>
      <p className="mt-3 text-center text-[11px] text-gray-400">Setelah terkirim, kode otomatis masuk daftar “Sudah Dikasih” di tab Kode.</p>
    </>
  )
}

function StatBox({ label, value, hl }: { label: string; value: number; hl?: boolean }) {
  return (
    <Card className={clsx('text-center', hl && 'bg-sage-50 dark:bg-sage-500/10')}>
      <p className={clsx('nums text-2xl font-extrabold', hl ? 'text-sage-700' : 'text-maroon-700 dark:text-dusty-200')}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </Card>
  )
}
function Loading() { return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-maroon-700" /></div> }
function ErrMsg({ msg }: { msg: string }) { return <p className="rounded-xl bg-wine-50 px-3 py-3 text-center text-sm text-wine-600 dark:bg-wine-500/10">{msg}</p> }
