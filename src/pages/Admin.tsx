import { useState } from 'react'
import { MessageCircle, Users, KeyRound, Copy, Plus, Loader2, ShieldCheck, RefreshCw, Trash2, UserPlus, UserCheck, RotateCcw, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useProfile } from '@/hooks/useProfile'
import { useAdminOverview, useGenerateCodes, useDeleteUser, useReserveCode, useUnreserveCode } from '@/hooks/useAdminData'
import { AdminChat } from '@/pages/AdminChat'
import { formatTanggal } from '@/lib/format'
import { clsx } from '@/lib/clsx'

type Tab = 'chat' | 'users' | 'codes'

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
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'codes', label: 'Kode', icon: KeyRound },
  ]

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Panel Admin" />
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-card dark:bg-gray-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx('flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition',
              tab === t.id ? 'bg-maroon-700 text-white' : 'text-gray-500')}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'chat' && <AdminChat embedded />}
      {tab === 'users' && <UsersTab />}
      {tab === 'codes' && <CodesTab />}
    </div>
  )
}

function UsersTab() {
  const { data, isLoading, error } = useAdminOverview(true)
  const del = useDeleteUser()
  if (isLoading) return <Loading />
  if (error) return <ErrMsg msg={(error as Error).message} />
  const users = data?.users ?? []

  async function hapus(id: string, nama: string) {
    if (!confirm(`Hapus akun "${nama}"? Semua data (transaksi, dompet, dll) ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`)) return
    try { await del.mutateAsync(id) } catch (e) { alert((e as Error).message) }
  }

  return (
    <>
      <p className="mb-3 text-sm text-gray-400">{users.length} pengguna terdaftar</p>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-100 font-bold text-maroon-700 dark:bg-maroon-500/20">
              {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-semibold">
                {u.full_name || 'Pengguna'}
                {u.is_admin && <ShieldCheck size={14} className="shrink-0 text-sage-600" />}
              </p>
              <p className="truncate text-xs text-gray-400">{u.email}</p>
              <p className="mt-0.5 text-[11px]">
                {u.code
                  ? <span className="nums rounded bg-dusty-100 px-1.5 py-0.5 font-semibold tracking-wider text-maroon-700 dark:bg-dusty-500/15 dark:text-dusty-200">🔑 {u.code}</span>
                  : <span className="text-gray-400">{u.is_admin ? 'admin (tanpa kode)' : 'tanpa kode'}</span>}
                <span className="ml-2 text-gray-400">{formatTanggal(u.created_at)}</span>
              </p>
            </div>
            {!u.is_admin && (
              <button
                onClick={() => hapus(u.id, u.full_name || u.email || 'Pengguna')}
                disabled={del.isPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wine-50 text-wine-500 disabled:opacity-50 dark:bg-wine-500/10"
                aria-label="Hapus akun"
              >
                {del.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            )}
          </Card>
        ))}
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

  async function doGen() {
    const n = parseInt(count) || 0
    if (n < 1) return
    const res = await gen.mutateAsync(n)
    setJustGen(res.generated)
  }

  const copy = (txt: string) => navigator.clipboard?.writeText(txt)

  async function tandaiDikasih(code: string) {
    const label = prompt(`Kode ${code} dikasih ke siapa?\n(nama / no WA — biar kamu ingat)`)
    if (label == null) return
    const lbl = label.trim()
    if (!lbl) return
    setBusy(code)
    try { await reserve.mutateAsync({ code, label: lbl }); copy(code) }
    catch (e) { alert((e as Error).message) }
    finally { setBusy(null) }
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
