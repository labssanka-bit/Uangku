import { NavLink } from 'react-router-dom'
import { Home, ListChecks, BarChart3, Settings, Plus } from 'lucide-react'
import { clsx } from '@/lib/clsx'

interface BottomNavProps {
  onAdd: () => void
}

const items = [
  { to: '/', icon: Home, label: 'Beranda', end: true },
  { to: '/transaksi', icon: ListChecks, label: 'Transaksi' },
  { to: '/statistik', icon: BarChart3, label: 'Statistik' },
  { to: '/setting', icon: Settings, label: 'Setting' },
]

/** Floating pill nav — melayang di atas konten. */
export function BottomNav({ onAdd }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center"
      style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-0 rounded-full bg-maroon-700 px-3 py-2.5 shadow-nm dark:bg-maroon-900">
        {/* 2 item kiri */}
        {items.slice(0, 2).map((it) => (
          <NavItem key={it.to} {...it} />
        ))}

        {/* Tombol "+" di tengah — dusty pink bercahaya */}
        <button
          onClick={onAdd}
          aria-label="Tambah transaksi"
          className="relative mx-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dusty-400 shadow-[0_0_20px_rgba(213,146,164,0.7)] active:scale-90 transition-transform"
        >
          <Plus size={26} strokeWidth={2.8} className="text-white" />
        </button>

        {/* 2 item kanan */}
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
    <NavLink to={to} end={end} className="flex w-14 flex-col items-center gap-0.5 py-1">
      {({ isActive }) => (
        <>
          <Icon
            size={21}
            className={clsx(
              'transition-colors',
              isActive ? 'text-dusty-300' : 'text-white/50'
            )}
          />
          <span
            className={clsx(
              'text-[9px] font-semibold tracking-wide transition-colors',
              isActive ? 'text-dusty-300' : 'text-white/40'
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
