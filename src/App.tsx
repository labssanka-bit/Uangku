import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { isDemo, exitDemo } from '@/lib/demo'
import { useAutoPostRecurring } from '@/hooks/useAutoPostRecurring'
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

export default function App() {
  const dark = useUIStore((s) => s.dark)
  const { addOpen, addPreset, openAdd, closeAdd } = useUIStore()
  const { session, loading } = useAuth()

  // Auto-post transaksi berulang yang jatuh tempo (sekali per sesi)
  useAutoPostRecurring()

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

  if (!session) return <Login />

  const demo = isDemo()

  return (
    <div className="min-h-screen lg:pl-60" style={{ background: 'inherit' }}>
      {demo && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-gradient-to-r from-maroon-700 to-maroon-900 px-4 py-2 text-center text-xs font-semibold text-white lg:pl-60">
          <span>👀 Kamu sedang melihat MODE DEMO — data ini cuma contoh.</span>
          <button
            onClick={() => { exitDemo(); window.location.href = '/' }}
            className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-maroon-800"
          >
            Daftar / Masuk
          </button>
        </div>
      )}
      <Sidebar onAdd={() => openAdd()} />

      <main className={`mx-auto min-h-screen max-w-md pb-32 lg:max-w-5xl lg:px-8 lg:pb-10 ${demo ? 'pt-9' : ''}`}>
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
          <Route path="/setting" element={<Settings />} />
        </Routes>
      </main>

      {/* Pill nav hanya di mobile; desktop pakai Sidebar */}
      <div className="lg:hidden">
        <BottomNav onAdd={() => openAdd()} />
      </div>
      <TransactionSheet open={addOpen} onClose={closeAdd} preset={addPreset} />
    </div>
  )
}
