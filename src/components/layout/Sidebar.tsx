import { NavLink } from 'react-router-dom'
import {
  Home, ListChecks, BarChart3, PiggyBank, Repeat, Tags,
  Landmark, HandCoins, Gem, Settings as Cog, Plus, Wallet,
} from 'lucide-react'
import { clsx } from '@/lib/clsx'

interface Props {
  onAdd: () => void
}

const items = [
  { to: '/', icon: Home, label: 'Beranda', end: true },
  { to: '/transaksi', icon: ListChecks, label: 'Transaksi' },
  { to: '/statistik', icon: BarChart3, label: 'Statistik' },
  { to: '/dompet', icon: Landmark, label: 'Dompet' },
  { to: '/hutang', icon: HandCoins, label: 'Hutang' },
  { to: '/aset', icon: Gem, label: 'Aset' },
  { to: '/anggaran', icon: PiggyBank, label: 'Anggaran' },
  { to: '/berulang', icon: Repeat, label: 'Berulang' },
  { to: '/kategori', icon: Tags, label: 'Kategori' },
  { to: '/setting', icon: Cog, label: 'Setting' },
]

/** Sidebar navigasi — hanya tampil di layar besar (lg+). */
export function Sidebar({ onAdd }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-maroon-100/60 bg-white/70 px-4 py-6 backdrop-blur lg:flex dark:border-maroon-900/40 dark:bg-[#1C1418]/80">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-maroon-600 to-maroon-800 text-white shadow-soft">
          <Wallet size={20} />
        </span>
        <span className="text-lg font-extrabold text-maroon-800 dark:text-dusty-200">Finplan Sanka</span>
      </div>

      {/* Tombol tambah */}
      <button
        onClick={onAdd}
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-maroon-700 py-2.5 font-semibold text-white shadow-soft transition active:scale-95 hover:bg-maroon-800"
      >
        <Plus size={18} /> Tambah Transaksi
      </button>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-maroon-700 text-white shadow-card'
                  : 'text-gray-500 hover:bg-maroon-50 hover:text-maroon-700 dark:text-gray-400 dark:hover:bg-maroon-900/30'
              )
            }
          >
            <it.icon size={19} />
            {it.label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-4 px-2 text-[11px] text-gray-400">Finplan Sanka v1.0</p>
    </aside>
  )
}
