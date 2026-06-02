import { getIcon } from '@/lib/icons'
import { clsx } from '@/lib/clsx'

interface CategoryIconProps {
  icon?: string | null
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { box: 'h-9 w-9', icon: 18 },
  md: { box: 'h-11 w-11', icon: 22 },
  lg: { box: 'h-14 w-14', icon: 28 },
}

/** Lingkaran berwarna pastel berisi ikon kategori. */
export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = getIcon(icon)
  const c = color ?? '#64748b'
  const s = SIZES[size]
  return (
    <div
      className={clsx('flex items-center justify-center rounded-2xl', s.box, className)}
      style={{ backgroundColor: `${c}22`, color: c }} // 22 = ~13% opacity
    >
      <Icon size={s.icon} strokeWidth={2.2} />
    </div>
  )
}
