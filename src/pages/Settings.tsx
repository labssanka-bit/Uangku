import { useState } from 'react'
import { User, Coins, Download, Trash2, LogOut, Moon, Sun, ChevronRight, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useUIStore } from '@/store/uiStore'
import { exportTransactionsCSV } from '@/lib/export'
import { formatRupiah, parseRupiah } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export function Settings() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { dark, toggleDark } = useUIStore()

  const [editName, setEditName] = useState(false)
  const [name, setName] = useState('')
  const [editOpening, setEditOpening] = useState(false)
  const [opening, setOpening] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleExport() {
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
    if (!confirm('Hapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan.')) return
    const { error } = await supabase.from('transactions').delete().eq('user_id', user!.id)
    if (error) alert('Gagal mereset data.')
    else alert('Semua transaksi dihapus.')
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
          icon={Wallet}
          label="Saldo Awal"
          onClick={() => {
            setOpening(profile?.opening_balance ? String(profile.opening_balance) : '')
            setEditOpening(true)
          }}
          right={
            <span className="nums text-sm text-gray-400">{formatRupiah(profile?.opening_balance ?? 0)}</span>
          }
        />
        <Row icon={Coins} label="Mata Uang" right={<span className="text-sm text-gray-400">{profile?.currency ?? 'IDR'}</span>} />
        <Row icon={Download} label={busy ? 'Mengekspor…' : 'Ekspor Data (CSV)'} onClick={handleExport} right={<ChevronRight size={18} className="text-gray-300" />} />
      </Card>

      {/* Zona bahaya */}
      <Card className="mb-4 divide-y divide-gray-100 p-0 dark:divide-gray-800">
        <Row icon={Trash2} label="Reset Semua Transaksi" onClick={handleReset} danger right={<ChevronRight size={18} className="text-wine-500/40" />} />
        <Row icon={LogOut} label="Keluar" onClick={signOut} danger />
      </Card>

      <p className="text-center text-xs text-gray-400">UangKu v1.0 — dibuat untuk mempermudah catatan keuanganmu.</p>

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
            await updateProfile.mutateAsync({ full_name: name.trim() })
            setEditName(false)
          }}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft"
        >
          Simpan
        </button>
      </Sheet>

      {/* Saldo awal */}
      <Sheet open={editOpening} onClose={() => setEditOpening(false)} title="Saldo Awal">
        <p className="mb-3 text-center text-xs text-gray-400">
          Masukkan saldo uangmu saat ini (kas + rekening). Dipakai sebagai titik awal
          perhitungan Total Saldo, tanpa perlu mencatat semua transaksi lama.
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
            await updateProfile.mutateAsync({ opening_balance: parseRupiah(opening) })
            setEditOpening(false)
          }}
          className="w-full rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft"
        >
          Simpan
        </button>
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
