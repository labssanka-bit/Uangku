import { clsx } from '@/lib/clsx'

interface ProgressBarProps {
  /** rasio 0..1+ (boleh > 1 jika melebihi limit) */
  ratio: number
  className?: string
}

/** Warna berubah hijau → kuning → merah saat mendekati/melebihi limit. */
export function ProgressBar({ ratio, className }: ProgressBarProps) {
  const pct = Math.min(ratio, 1) * 100
  const color =
    ratio >= 1
      ? 'bg-wine-500'
      : ratio >= 0.8
        ? 'bg-amber-400'
        : 'bg-sage-500'

  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
