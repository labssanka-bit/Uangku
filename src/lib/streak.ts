/** Hitung streak (hari beruntun mencatat) dari kumpulan tanggal transaksi. */
import { differenceInCalendarDays, parseISO } from 'date-fns'

/**
 * @param dates daftar tanggal "yyyy-MM-dd" (boleh duplikat/tak urut)
 * @returns jumlah hari beruntun s.d. hari ini. Bolong sehari → reset.
 *          Streak tetap hidup bila catat terakhir = hari ini atau kemarin.
 */
export function computeStreak(dates: string[], today = new Date()): number {
  if (dates.length === 0) return 0

  // Set hari unik
  const set = new Set(dates)
  const uniq = Array.from(set)
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime()) // terbaru dulu

  const last = uniq[0]
  const gapFromToday = differenceInCalendarDays(today, last)
  if (gapFromToday > 1) return 0 // terakhir catat > kemarin → streak putus

  let streak = 1
  for (let i = 1; i < uniq.length; i++) {
    const gap = differenceInCalendarDays(uniq[i - 1], uniq[i])
    if (gap === 1) streak++
    else if (gap === 0) continue
    else break
  }
  return streak
}

/** Label milestone untuk badge. */
export function streakMilestone(streak: number): string | null {
  if (streak >= 100) return '💎 100+ hari!'
  if (streak >= 30) return '🏆 30 hari!'
  if (streak >= 7) return '⭐ 7 hari!'
  return null
}
