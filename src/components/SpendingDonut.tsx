import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'
import { Card } from './ui/Card'
import { CategoryIcon } from './ui/CategoryIcon'
import { formatRupiah } from '@/lib/format'
import { clsx } from '@/lib/clsx'

interface Cat {
  id: string
  name: string
  color: string
  icon: string
  total: number
  pct: number
}

/** Donut pengeluaran bulan ini per kategori + legenda. */
export function SpendingDonut({ cats, total, blur }: { cats: Cat[]; total: number; blur?: boolean }) {
  if (cats.length === 0 || total <= 0) return null
  const top = cats.slice(0, 6)

  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Pengeluaran Bulan Ini</h2>
        <Link to="/statistik" className="text-xs font-semibold text-maroon-700">Detail</Link>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        {/* Donut + total di tengah */}
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top}
                dataKey="total"
                nameKey="name"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
              >
                {top.map((c) => (
                  <Cell key={c.id} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n) => [formatRupiah(v), n as string]}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-gray-400">Total</span>
            <span className={clsx('nums text-center text-base font-extrabold text-maroon-800 dark:text-dusty-200', blur && 'privacy-blur')}>
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Legenda */}
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {top.map((c) => (
            <Link key={c.id} to="/statistik" className="flex items-center gap-2 active:opacity-70">
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
              <span className="nums text-xs font-semibold text-gray-400">{Math.round(c.pct * 100)}%</span>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}
