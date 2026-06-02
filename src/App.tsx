import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/layout/BottomNav'
import { TransactionSheet } from '@/components/TransactionSheet'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Statistics } from '@/pages/Statistics'
import { Budget } from '@/pages/Budget'
import { Recurring } from '@/pages/Recurring'
import { Categories } from '@/pages/Categories'
import { Settings } from '@/pages/Settings'

export default function App() {
  const dark = useUIStore((s) => s.dark)
  const { session, loading } = useAuth()
  const [addOpen, setAddOpen] = useState(false)

  // Terapkan class `dark` ke <html> untuk Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 pb-28 dark:bg-gray-950">
      <Routes>
        <Route path="/" element={<Dashboard onAdd={() => setAddOpen(true)} />} />
        <Route path="/transaksi" element={<Transactions onAdd={() => setAddOpen(true)} />} />
        <Route path="/statistik" element={<Statistics />} />
        <Route path="/anggaran" element={<Budget />} />
        <Route path="/berulang" element={<Recurring />} />
        <Route path="/kategori" element={<Categories />} />
        <Route path="/setting" element={<Settings />} />
      </Routes>

      <BottomNav onAdd={() => setAddOpen(true)} />
      <TransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
