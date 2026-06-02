import { NavLink } from 'react-router-dom'
import { Home, ListChecks, BarChart3, Settings, Plus } from 'lucide-react'
import { clsx } from '@/lib/clsx'

interface BottomNavProps {
  /** Buka sheet tambah transaksi cepat */
  onAdd: () => void
}

const items = [
  { to: '/', icon: Home, label: 'Beranda', end: true },
  { to: '/transaksi', icon: ListChecks, label: 'Transaksi' },
  { to: '/statistik', icon: BarChart3, label: 'Statistik' },
  { to: '/setting', icon: Settings, label: 'Setting' },
]

/** Bottom navigation mobile dengan tombol "+" besar di tengah. */
export function BottomNav({ onAdd }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md">
      <div className="safe-bottom relative flex items-center justify-around border-t border-gray-200/70 bg-white/90 px-2 pt-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        {items.slice(0, 2).map((it) => (
          <NavItem key={it.to} {...it} />
        ))}

        {/* Tombol tambah cepat */}
        <button
          onClick={onAdd}
          aria-label="Tambah transaksi"
          className="relative -mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-maroon-600 to-maroon-800 text-white shadow-soft ring-4 ring-dusty-50 active:scale-95 dark:ring-gray-950"
        >
          <Plus size={30} strokeWidth={2.6} />
        </button>

        {items.slice(2).map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
      </div>
    </nav>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string
  icon: typeof Home
  label: string
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex w-16 flex-col items-center gap-0.5 py-1"
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            className={clsx(
              isActive ? 'text-maroon-700 dark:text-maroon-300' : 'text-gray-400'
            )}
          />
          <span
            className={clsx(
              'text-[10px] font-medium',
              isActive ? 'text-maroon-700 dark:text-maroon-300' : 'text-gray-400'
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
