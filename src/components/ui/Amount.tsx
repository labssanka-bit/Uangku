import { formatRupiah } from '@/lib/format'
import { useUIStore } from '@/store/uiStore'
import { clsx } from '@/lib/clsx'

interface AmountProps {
  value: number
  className?: string
  /** Tambah tanda +/- sesuai tipe */
  signed?: 'income' | 'expense'
  /** Warna netral abu-abu (mis. untuk transfer antar dompet) */
  muted?: boolean
  ringkas?: boolean
}

/**
 * Tampilkan nominal Rupiah dengan dukungan privacy mode (blur saat aktif).
 */
export function Amount({ value, className, signed, muted }: AmountProps) {
  const privacy = useUIStore((s) => s.privacy)
  const prefix = signed === 'income' ? '+' : signed === 'expense' ? '-' : ''
  const colorClass = muted
    ? 'text-gray-400 dark:text-gray-500'
    : signed === 'income'
      ? 'text-sage-600 dark:text-sage-500'
      : signed === 'expense'
        ? 'text-wine-500 dark:text-wine-500'
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
