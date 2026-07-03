import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { User, Coins, Download, Trash2, LogOut, Moon, Sun, ChevronRight, Wallet, Palette, Check, Headset, Eraser } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useWalletBalances, useWalletMutations } from '@/hooks/useWallets'
import { useUIStore } from '@/store/uiStore'
import { exportTransactionsCSV } from '@/lib/export'
import { formatRupiah, parseRupiah } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { isDemo, demoBlock } from '@/lib/demo'
import { THEMES } from '@/lib/themes'
import { clsx } from '@/lib/clsx'

export function Settings() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { wallets } = useWalletBalances()
  const { update: updateWallet } = useWalletMutations()
  const { dark, toggleDark } = useUIStore()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const [themeOpen, setThemeOpen] = useState(false)
  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  const qc = useQueryClient()
  const nav = useNavigate()

  // Dompet utama (Cash default) — tempat "Saldo Awal" disimpan
  const mainWallet = wallets.find((w) => w.is_default && w.group === 'cashflow') ?? wallets[0] ?? null

  const [editName, setEditName] = useState(false)
  const [name, setName] = useState('')
  const [editOpening, setEditOpening] = useState(false)
  const [opening, setOpening] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const errMsg = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message : (e as { message?: string })?.message || fallback

  async function handleExport() {
    if (isDemo()) { demoBlock(); return }
    setBusy(true)
    try {
      await exportTransactionsCSV()
    } catch {
      alert('Gagal mengekspor data.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (isDemo()) { demoBlock(); return }
    if (!confirm('Hapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan.')) return
    // .select() → tahu berapa baris benar-benar terhapus (deteksi kalau 0)
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user!.id)
      .select('id')
    if (error) {
      alert('Gagal mereset: ' + error.message)
      return
    }
    // Segarkan semua data terkait agar saldo & list langsung kosong
    await qc.invalidateQueries()
    alert(`${data?.length ?? 0} transaksi dihapus.`)
  }

  async function handleResetTotal() {
    if (isDemo()) { demoBlock(); return }
    if (!confirm('RESET TOTAL: hapus SEMUA transaksi DAN nol-kan Saldo Awal semua dompet?\nTotal Saldo jadi Rp 0. Tindakan ini tidak bisa dibatalkan.')) return
    setBusy(true)
    try {
      // 1) Hapus semua transaksi milik user (RLS + filter user_id → hanya akun ini)
      const { data: del, error: e1 } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user!.id)
        .select('id')
      if (e1) throw e1
      // 2) Nol-kan saldo awal semua dompet milik user
      const { error: e2 } = await supabase
        .from('wallets')
        .update({ opening_balance: 0 })
        .eq('user_id', user!.id)
      if (e2) throw e2
      await qc.invalidateQueries()
      alert(`Reset total selesai. ${del?.length ?? 0} transaksi dihapus & saldo awal semua dompet jadi 0.`)
    } catch (e) {
      alert('Gagal reset total: ' + errMsg(e, 'terjadi kesalahan.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Setting" />

      {/* Profil */}
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-100 text-maroon-700 dark:bg-maroon-500/20">
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{profile?.full_name ?? 'Pengguna'}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setSaveError(null)
              setName(profile?.full_name ?? '')
              setEditName(true)
            }}
            className="text-sm font-semibold text-maroon-700"
          >
            Edit
          </button>
        </div>
      </Card>

      {/* Daftar setting */}
      <Card className="mb-4 divide-y divide-gray-100 p-0 dark:divide-gray-800">
        <Row icon={dark ? Sun : Moon} label="Mode Gelap" onClick={toggleDark} right={
          <span className={`h-6 w-11 rounded-full p-0.5 transition ${dark ? 'bg-maroon-700' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white transition ${dark ? 'translate-x-5' : ''}`} />
          </span>
        } />
        <Row
          icon={Palette}
          label="Tema Warna"
          onClick={() => setThemeOpen(true)}
          right={
            <span className="flex items-center gap-2">
              <span className="flex">
                <span className="h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-900" style={{ background: activeTheme.primary }} />
                <span className="-ml-1.5 h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-900" style={{ background: activeTheme.accent }} />
              </span>
              <span className="text-sm text-gray-400">{activeTheme.name}</span>
            </span>
          }
        />
        <Row
          icon={Wallet}
          label={`Saldo Awal ${mainWallet ? `(${mainWallet.name})` : ''}`}
          onClick={() => {
            setSaveError(null)
            setOpening(mainWallet?.opening_balance ? String(mainWallet.opening_balance) : '')
            setEditOpening(true)
          }}
          right={
            <span className="nums text-sm text-gray-400">{formatRupiah(mainWallet?.opening_balance ?? 0)}</span>
          }
        />
        <Row icon={Coins} label="Mata Uang" right={<span className="text-sm text-gray-400">{profile?.currency ?? 'IDR'}</span>} />
        <Row icon={Download} label={busy ? 'Mengekspor…' : 'Ekspor Data (CSV)'} onClick={handleExport} right={<ChevronRight size={18} className="text-gray-300" />} />
      </Card>

      {/* Admin (hanya untuk akun admin) */}
      {profile?.is_admin && (
        <Card className="mb-4 p-0">
          <Row icon={Headset} label="Panel Admin" onClick={() => nav('/admin')} right={<ChevronRight size={18} className="text-gray-300" />} />
        </Card>
      )}

      {/* Zona bahaya */}
      <Card className="mb-2 divide-y divide-gray-100 p-0 dark:divide-gray-800">
        <Row icon={Trash2} label="Reset Semua Transaksi" onClick={handleReset} danger right={<ChevronRight size={18} className="text-wine-500/40" />} />
        <Row icon={Eraser} label="Reset Total (transaksi + saldo awal → 0)" onClick={handleResetTotal} danger right={<ChevronRight size={18} className="text-wine-500/40" />} />
        <Row icon={LogOut} label="Keluar" onClick={signOut} danger />
      </Card>
      <p className="mb-4 px-1 text-center text-[11px] text-gray-400">
        Reset hanya menghapus data <b>akun kamu sendiri</b>, tidak menyentuh akun lain.
      </p>

      <p className="text-center text-xs text-gray-400">Finplan Sanka v1.0 — dibuat untuk mempermudah catatan keuanganmu.</p>

      {/* Edit nama */}
      <Sheet open={editName} onClose={() => setEditName(false)} title="Edit Nama">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center font-semibold outline-none dark:bg-gray-800"
        />
        <button
          onClick={async () => {
            setSaveError(null)
            try {
              await updateProfile.mutateAsync({ full_name: name.trim() })
              setEditName(false)
            } catch (e) {
              setSaveError(errMsg(e, 'Gagal menyimpan nama.'))
            }
          }}
          disabled={updateProfile.isPending}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
        {saveError && (
          <p className="mt-3 rounded-xl bg-wine-50 px-3 py-2 text-center text-xs text-wine-600 dark:bg-wine-500/10">
            {saveError}
          </p>
        )}
      </Sheet>

      {/* Saldo awal */}
      <Sheet open={editOpening} onClose={() => setEditOpening(false)} title={`Saldo Awal ${mainWallet ? mainWallet.name : ''}`}>
        <p className="mb-3 text-center text-xs text-gray-400">
          Saldo awal dompet utama <b>{mainWallet?.name ?? ''}</b> (kas saat ini). Jadi titik awal
          perhitungan Total Saldo. Dompet lain atur saldo awalnya masing-masing di menu Dompet.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          value={opening ? formatRupiah(parseRupiah(opening), false) : ''}
          onChange={(e) => setOpening(e.target.value)}
          placeholder="0"
          className="nums mb-4 w-full rounded-2xl bg-gray-100 px-4 py-3 text-center text-2xl font-bold outline-none dark:bg-gray-800"
        />
        <button
          onClick={async () => {
            setSaveError(null)
            if (!mainWallet) { setSaveError('Belum ada dompet. Buat dompet dulu di menu Dompet.'); return }
            try {
              await updateWallet.mutateAsync({ id: mainWallet.id, opening_balance: parseRupiah(opening) })
              setEditOpening(false)
            } catch (e) {
              setSaveError(errMsg(e, 'Gagal menyimpan saldo awal.'))
            }
          }}
          disabled={updateWallet.isPending}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft disabled:opacity-50"
        >
          {updateWallet.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
        {saveError && (
          <p className="mt-3 rounded-xl bg-wine-50 px-3 py-2 text-center text-xs text-wine-600 dark:bg-wine-500/10">
            {saveError}
          </p>
        )}
      </Sheet>

      {/* Picker tema warna (17) */}
      <Sheet open={themeOpen} onClose={() => setThemeOpen(false)} title="Pilih Tema">
        <p className="mb-4 text-center text-xs text-gray-400">
          17 tema warna. Ketuk untuk langsung pakai — bisa diganti kapan saja.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const active = t.id === theme
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setThemeOpen(false) }}
                className={clsx(
                  'relative overflow-hidden rounded-2xl p-3 text-left transition active:scale-95',
                  active ? 'ring-2 ring-maroon-600' : 'ring-1 ring-gray-200 dark:ring-gray-800'
                )}
                style={{ background: t.bg }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="h-8 w-8 rounded-xl shadow-sm" style={{ background: t.primary }} />
                  <span className="h-8 w-8 rounded-xl shadow-sm" style={{ background: t.accent }} />
                  {active && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: t.primary }}>
                      <Check size={14} />
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold" style={{ color: t.primary }}>{t.name}</span>
              </button>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  onClick,
  right,
  danger,
}: {
  icon: typeof User
  label: string
  onClick?: () => void
  right?: React.ReactNode
  danger?: boolean
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <Icon size={20} className={danger ? 'text-wine-500' : 'text-gray-500'} />
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-wine-500' : ''}`}>{label}</span>
      {right}
    </button>
  )
}
