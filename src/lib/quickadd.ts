/** Susun saran "quick-add" dari transaksi yang sering dicatat. */
import type { Transaction, TxType } from '@/types'

export interface QuickChip {
  label: string
  type: TxType
  category_id: string | null
  note: string | null
  icon?: string
  color?: string
}

/**
 * Ambil transaksi bercatatan yang paling sering muncul (top N).
 * Dikelompokkan per (tipe + kategori + catatan) agar 1-tap mengisi ulang.
 */
export function buildQuickChips(transactions: Transaction[], limit = 4): QuickChip[] {
  const map = new Map<string, { chip: QuickChip; count: number }>()

  for (const t of transactions) {
    const note = t.note?.trim()
    if (!note) continue // hanya yang punya nama jelas
    if (note.startsWith('⇄')) continue // transfer internal, bukan transaksi rutin
    const key = `${t.type}|${t.category_id ?? ''}|${note.toLowerCase()}`
    const prev = map.get(key)
    if (prev) prev.count++
    else
      map.set(key, {
        count: 1,
        chip: {
          label: note,
          type: t.type,
          category_id: t.category_id,
          note,
          icon: t.category?.icon,
          color: t.category?.color,
        },
      })
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((v) => v.chip)
}
