import type { ReactNode } from 'react'
import { clsx } from '@/lib/clsx'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

/** Kartu neumorphic: shadow lembut dua sisi, rounded-2xl, bg putih. */
export function Card({ children, className, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        'rounded-2xl bg-white p-4 shadow-nm-sm ring-1 ring-black/[0.03] dark:bg-[#251A1F] dark:ring-white/[0.05]',
        onClick && 'cursor-pointer transition-all active:scale-[0.985] active:shadow-nm-inset lg:hover:-translate-y-0.5 lg:hover:shadow-nm',
        className
      )}
    >
      {children}
    </div>
  )
}
