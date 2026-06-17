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
        'rounded-2xl bg-white p-4 shadow-nm-sm dark:bg-[#201A38]',
        onClick && 'cursor-pointer transition-all active:shadow-nm-inset active:scale-[0.985]',
        className
      )}
    >
      {children}
    </div>
  )
}
