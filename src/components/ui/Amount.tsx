import { formatRupiah } from '@/lib/format'
import { useUIStore } from '@/store/uiStore'
import { clsx } from '@/lib/clsx'

interface AmountProps {
  value: number
  className?: string
  /** Tambah tanda +/- sesuai tipe */
  signed?: 'income' | 'expense'
  ringkas?: boolean
}

/**
 * Tampilkan nominal Rupiah dengan dukungan privacy mode (blur saat aktif).
 */
export function Amount({ value, className, signed }: AmountProps) {
  const privacy = useUIStore((s) => s.privacy)
  const prefix = signed === 'income' ? '+' : signed === 'expense' ? '-' : ''
  const colorClass =
    signed === 'income'
      ? 'text-emerald-600 dark:text-emerald-400'
      : signed === 'expense'
        ? 'text-rose-500 dark:text-rose-400'
        : ''

  return (
    <span
      className={clsx('nums', colorClass, privacy && 'privacy-blur', className)}
      aria-label={privacy ? 'disembunyikan' : undefined}
    >
      {prefix}
      {formatRupiah(value)}
    </span>
  )
}
