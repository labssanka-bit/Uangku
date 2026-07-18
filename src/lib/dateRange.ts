/** Util periode bulan: rentang tanggal, hari tersisa, dll. */
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  differenceInCalendarDays,
  isSameMonth,
} from 'date-fns'
import { toISODate } from './format'

export interface Periode {
  /** Tanggal acuan (biasanya tanggal 1 bulan terpilih) */
  ref: Date
  month: number // 1-12
  year: number
  /** ISO awal & akhir bulan, untuk query Supabase .gte/.lte */
  start: string
  end: string
}

/** Periode "Semua Data" — akumulasi lintas bulan/tahun. month/year=0 = sentinel. */
export const ALL_PERIODE: Periode = {
  ref: new Date('2000-01-01'),
  month: 0,
  year: 0,
  start: '1970-01-01',
  end: '2999-12-31',
}

export function buildPeriode(ref: Date): Periode {
  return {
    ref,
    month: ref.getMonth() + 1,
    year: ref.getFullYear(),
    start: toISODate(startOfMonth(ref)),
    end: toISODate(endOfMonth(ref)),
  }
}

export function bulanBerikut(ref: Date): Date {
  return addMonths(ref, 1)
}
export function bulanSebelum(ref: Date): Date {
  return subMonths(ref, 1)
}

/**
 * Sisa hari sampai akhir bulan. Jika bulan terpilih = bulan berjalan,
 * dihitung dari hari ini; jika bukan, kembalikan total hari bulan tsb.
 */
export function sisaHari(ref: Date): number {
  const today = new Date()
  if (isSameMonth(ref, today)) {
    const days = differenceInCalendarDays(endOfMonth(ref), today)
    return Math.max(days, 1) // minimal 1 agar pembagian aman
  }
  return differenceInCalendarDays(endOfMonth(ref), startOfMonth(ref)) + 1
}

/** Jumlah hari yang sudah berlalu di bulan ini (untuk rata-rata harian). */
export function hariBerlalu(ref: Date): number {
  const today = new Date()
  if (isSameMonth(ref, today)) return today.getDate()
  return differenceInCalendarDays(endOfMonth(ref), startOfMonth(ref)) + 1
}
