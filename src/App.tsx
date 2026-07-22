import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { isDemo } from '@/lib/demo'
import { applyTheme } from '@/lib/themes'
import { useAutoPostRecurring } from '@/hooks/useAutoPostRecurring'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useProfile } from '@/hooks/useProfile'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TransactionSheet } from '@/components/TransactionSheet'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Statistics } from '@/pages/Statistics'
import { Budget } from '@/pages/Budget'
import { Recurring } from '@/pages/Recurring'
import { Categories } from '@/pages/Categories'
import { Settings } from '@/pages/Settings'
import { Wallets } from '@/pages/Wallets'
import { Debts } from '@/pages/Debts'
import { Assets } from '@/pages/Assets'
import { Admin } from '@/pages/Admin'
import { Panduan } from '@/pages/Panduan'
import { ResetPassword } from '@/pages/ResetPassword'
import { SupportChat } from '@/components/SupportChat'

export default function App() {
  const dark = useUIStore((s) => s.dark)
  const theme = useUIStore((s) => s.theme)
  const { addOpen, addPreset, openAdd, closeAdd } = useUIStore()
  const { session, loading, recovery, signOut } = useAuth()
  const { data: profile } = useProfile()

  // Auto-post transaksi berulang yang jatuh tempo (sekali per sesi)
  useAutoPostRecurring()

  // Denyut aktivitas → admin tahu siapa sedang/terakhir aktif
  useHeartbeat()

  // Terapkan tema warna ke <html data-theme>
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Terapkan class `dark` ke <html> untuk Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dusty-50 dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-maroon-700 border-t-transparent" />
      </div>
    )
  }

  // Klik link reset password dari email → set password baru
  if (recovery) return <ResetPassword />

  if (!session) return <Login />

  // Masa aktif habis (paket bulanan) → blokir sampai perpanjang. Admin & lifetime bebas.
  const expired = !!profile?.access_until && !profile?.is_admin && new Date(profile.access_until) < new Date()
  if (expired) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
        <img src="/logo.png" alt="Finplan Sanka" className="mx-auto mb-6 w-40" />
        <div className="rounded-3xl bg-white p-6 shadow-nm-sm dark:bg-[#251A1F]">
          <p className="text-4xl">⏳</p>
          <h1 className="mt-3 text-xl font-extrabold text-maroon-800 dark:text-dusty-200">Masa Aktif Berakhir</h1>
          <p className="mt-2 text-sm text-gray-500">
            Paket kamu berlaku sampai{' '}
            <b>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile!.access_until!))}</b>.
            Perpanjang untuk lanjut memakai Finplan Sanka. Datamu aman & tetap tersimpan.
          </p>
          <a
            href="https://digital-store-27.myscalev.com/lifetimefinplansanka"
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft"
          >
            Upgrade Selamanya — Rp149.000 →
          </a>
          <a
            href="https://digital-store-27.myscalev.com/monthlyfinplansanka"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block rounded-2xl border-2 border-maroon-700 py-3 font-bold text-maroon-700 dark:text-dusty-200"
          >
            Perpanjang Bulanan — Rp99.000 →
          </a>
          <p className="mt-3 text-xs text-gray-400">
            Sudah perpanjang? Hubungi admin lewat WhatsApp/Instagram untuk aktivasi ulang.
          </p>
          <button onClick={signOut} className="mt-4 text-sm font-semibold text-gray-500">Keluar</button>
        </div>
      </div>
    )
  }

  const demo = isDemo()

  return (
    <div className="relative isolate min-h-screen lg:pl-60">
      {/* Ornamen ambient di latar — blob gradasi + ring + dot (warna brand, ikut tema) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-maroon-400/25 blur-3xl dark:bg-maroon-500/20" />
        <div className="absolute -right-40 top-10 h-[32rem] w-[32rem] rounded-full bg-dusty-400/25 blur-3xl dark:bg-dusty-500/20" />
        <div className="absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-sage-400/20 blur-3xl dark:bg-sage-500/15" />
        <div className="absolute bottom-0 right-1/4 h-[26rem] w-[26rem] rounded-full bg-maroon-300/20 blur-3xl dark:bg-maroon-400/10" />
        {/* ring garis samar */}
        <div className="absolute right-24 top-1/3 h-80 w-80 rounded-full border-2 border-maroon-300/25 dark:border-maroon-500/15" />
        <div className="absolute -bottom-24 left-10 h-[26rem] w-[26rem] rounded-full border-2 border-dusty-300/25 dark:border-dusty-500/15" />
        {/* dot grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(currentColor 1.3px, transparent 1.3px)', backgroundSize: '26px 26px', color: 'rgba(92,26,43,0.06)' }} />
      </div>
      {demo && (
        <div className="fixed inset-x-0 top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-to-r from-maroon-700 to-maroon-900 px-4 py-2 text-center text-xs font-semibold text-white lg:pl-60">
          <span>👀 MODE DEMO — cuma contoh untuk coba fitur. Data yang kamu isi <u>TIDAK tersimpan</u>.</span>
          <a
            href="https://digital-store-27.myscalev.com/lifetimefinplansanka"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-maroon-800"
          >
            Beli Akses →
          </a>
        </div>
      )}
      <Sidebar onAdd={() => openAdd()} />

      <main className={`mx-auto min-h-screen max-w-md pb-32 lg:max-w-6xl lg:px-10 lg:pb-10 xl:max-w-[1400px] xl:px-14 ${demo ? 'pt-9' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transaksi" element={<Transactions />} />
          <Route path="/statistik" element={<Statistics />} />
          <Route path="/anggaran" element={<Budget />} />
          <Route path="/berulang" element={<Recurring />} />
          <Route path="/kategori" element={<Categories />} />
          <Route path="/dompet" element={<Wallets />} />
          <Route path="/hutang" element={<Debts />} />
          <Route path="/aset" element={<Assets />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/panduan" element={<Panduan />} />
          <Route path="/setting" element={<Settings />} />
        </Routes>
      </main>

      {/* Pill nav hanya di mobile; desktop pakai Sidebar */}
      <div className="lg:hidden">
        <BottomNav onAdd={() => openAdd()} />
      </div>

      {/* Chat support melayang (user) */}
      <SupportChat />
      <TransactionSheet open={addOpen} onClose={closeAdd} preset={addPreset} />
    </div>
  )
}
