import type { ReactNode } from 'react'
import { clsx } from '@/lib/clsx'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

/** Kartu dasar: rounded-2xl, shadow lembut, padding lega. */
export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl bg-white p-4 shadow-card dark:bg-gray-900',
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className
      )}
    >
      {children}
    </div>
  )
}
