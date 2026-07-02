import { useState } from 'react'
import { MessageCircle, Users, KeyRound, Copy, Plus, Loader2, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useProfile } from '@/hooks/useProfile'
import { useAdminOverview, useGenerateCodes, useDeleteUser } from '@/hooks/useAdminData'
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
  const [count, setCount] = useState('30')
  const [justGen, setJustGen] = useState<string[] | null>(null)

  async function doGen() {
    const n = parseInt(count) || 0
    if (n < 1) return
    const res = await gen.mutateAsync(n)
    setJustGen(res.generated)
  }

  const copy = (txt: string) => navigator.clipboard?.writeText(txt)

  if (isLoading) return <Loading />
  if (error) return <ErrMsg msg={(error as Error).message} />
  const c = data!.codes
  const unusedList = c.unused.map((x) => x.code)

  return (
    <>
      {/* Statistik */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <StatBox label="Tersedia" value={c.unusedCount} hl />
        <StatBox label="Terkirim (tunggu aktivasi)" value={c.reservedCount ?? 0} />
        <StatBox label="Terpakai" value={c.used} />
        <StatBox label="Total" value={c.total} />
      </div>
      {(c.reservedCount ?? 0) > 0 && (
        <p className="mb-3 rounded-xl bg-dusty-50 px-3 py-2 text-center text-[11px] text-gray-500 dark:bg-dusty-500/10">
          🤖 {c.reservedCount} kode sudah dikirim otomatis ke pembeli &amp; menunggu mereka daftar. Disembunyikan dari daftar "Tersedia" agar tak terkirim dobel.
        </p>
      )}

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

      {/* Daftar tersisa */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Kode Tersedia ({c.unusedCount})</h2>
        <div className="flex gap-3">
          <button onClick={() => copy(unusedList.join('\n'))} className="flex items-center gap-1 text-sm font-semibold text-maroon-700"><Copy size={14} /> Salin semua</button>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-sm text-gray-400"><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /></button>
        </div>
      </div>
      <Card className="p-0">
        <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto no-scrollbar dark:divide-gray-800">
          {unusedList.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Semua kode terpakai. Generate baru di atas.</p>}
          {c.unused.map((k) => (
            <button key={k.code} onClick={() => copy(k.code)} className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-gray-50 dark:active:bg-gray-800">
              <span className="nums font-semibold tracking-wider text-maroon-700 dark:text-dusty-200">{k.code}</span>
              <Copy size={15} className="text-gray-300" />
            </button>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-center text-[11px] text-gray-400">Ketuk kode untuk menyalin. Kirim ke pembeli, otomatis tertandai terpakai saat dipakai daftar.</p>
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
