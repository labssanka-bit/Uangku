/**
 * Helper format mata uang Rupiah & tanggal Indonesia.
 */
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format angka ke Rupiah dengan pemisah titik.
 * formatRupiah(212048000) => "Rp 212.048.000"
 */
export function formatRupiah(value: number, withSymbol = true): string {
  const rounded = Math.round(value)
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded))
  const sign = rounded < 0 ? '-' : ''
  return withSymbol ? `${sign}Rp ${formatted}` : `${sign}${formatted}`
}

/**
 * Versi ringkas untuk angka besar: 1.500.000 => "1,5jt", 106000 => "106rb".
 */
export function formatRupiahRingkas(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')}M`
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')}jt`
  if (abs >= 1_000) return `${sign}Rp ${Math.round(abs / 1_000)}rb`
  return `${sign}Rp ${abs}`
}

/** Ubah string angka mentah dari input ("212.048.000") jadi number. */
export function parseRupiah(input: string): number {
  const digits = input.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

// ----------------------------------------------------------------------------
// Tanggal
// ----------------------------------------------------------------------------

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** "Sen, 25 Mei 2026" */
export function formatTanggal(value: string | Date): string {
  return format(toDate(value), 'EEE, d MMM yyyy', { locale: id })
}

/** "25 Mei 2026" (tanpa nama hari) */
export function formatTanggalPanjang(value: string | Date): string {
  return format(toDate(value), 'd MMMM yyyy', { locale: id })
}

/** "Mei 2026" — untuk selector bulan */
export function formatBulanTahun(value: string | Date): string {
  return format(toDate(value), 'MMMM yyyy', { locale: id })
}

/** "Senin, 25 Mei" — header grup tanggal di list transaksi */
export function formatHeaderHari(value: string | Date): string {
  return format(toDate(value), 'EEEE, d MMMM', { locale: id })
}

/** ISO "yyyy-MM-dd" untuk simpan ke DB / input date */
export function toISODate(value: Date): string {
  return format(value, 'yyyy-MM-dd')
}
