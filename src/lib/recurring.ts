/** Logika materialisasi transaksi berulang (client-side, tanpa cron server). */
import { addDays, addWeeks, addMonths, addYears, isAfter, parseISO } from 'date-fns'
import { toISODate } from './format'
import type { RecurrenceFreq, RecurringTransaction } from '@/types'

/** Majukan tanggal sesuai frekuensi. */
export function advanceDate(date: Date, freq: RecurrenceFreq): Date {
  switch (freq) {
    case 'daily':
      return addDays(date, 1)
    case 'weekly':
      return addWeeks(date, 1)
    case 'monthly':
      return addMonths(date, 1)
    case 'yearly':
      return addYears(date, 1)
  }
}

export interface DuePosting {
  /** transaksi yang harus dibuat (satu per kejadian jatuh tempo) */
  inserts: {
    user_id: string
    category_id: string | null
    amount: number
    type: RecurringTransaction['type']
    note: string | null
    date: string
    is_recurring: true
  }[]
  /** next_date baru per recurring id */
  advances: { id: string; next_date: string }[]
}

/**
 * Hitung transaksi yang jatuh tempo dari daftar recurring aktif.
 * Untuk tiap recurring, buat transaksi selama next_date <= hari ini,
 * lalu majukan next_date ke masa depan. Dibatasi 60 iterasi/recurring
 * sebagai pengaman (mis. data lama yang tertinggal jauh).
 */
export function computeDuePostings(
  items: RecurringTransaction[],
  today = new Date()
): DuePosting {
  const inserts: DuePosting['inserts'] = []
  const advances: DuePosting['advances'] = []

  // Normalisasi "today" ke akhir hari agar next_date == hari ini ikut diposting
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  for (const r of items) {
    if (!r.is_active) continue
    let cursor = parseISO(r.next_date)
    let guard = 0
    let changed = false

    while (!isAfter(cursor, cutoff) && guard < 60) {
      inserts.push({
        user_id: r.user_id,
        category_id: r.category_id,
        amount: r.amount,
        type: r.type,
        note: r.note,
        date: toISODate(cursor),
        is_recurring: true,
      })
      cursor = advanceDate(cursor, r.frequency)
      guard++
      changed = true
    }

    if (changed) advances.push({ id: r.id, next_date: toISODate(cursor) })
  }

  return { inserts, advances }
}
