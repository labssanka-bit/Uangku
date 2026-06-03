/**
 * Ekstrak nominal Rupiah dari teks bebas (hasil VN / OCR).
 * Dukung: "30000", "30.000", "30rb", "30 ribu", "1,5jt", "tiga puluh ribu".
 */

const UNIT: Record<string, number> = {
  ribu: 1_000,
  rb: 1_000,
  k: 1_000,
  juta: 1_000_000,
  jt: 1_000_000,
  m: 1_000_000, // sehari-hari "m" sering = juta
  miliar: 1_000_000_000,
}

const WORD_NUM: Record<string, number> = {
  nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
  enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10,
  sebelas: 11, seratus: 100, seribu: 1000,
}

/** Parse rangkaian kata angka Indonesia → number (skala kecil). */
function parseWords(text: string): number {
  const tokens = text.toLowerCase().split(/\s+/)
  let total = 0
  let current = 0
  for (const tk of tokens) {
    if (tk === 'puluh') current *= 10
    else if (tk === 'belas') current += 10
    else if (tk === 'ratus') current = (current || 1) * 100
    else if (tk === 'ribu' || tk === 'rb') {
      total += (current || 1) * 1000
      current = 0
    } else if (tk === 'juta' || tk === 'jt') {
      total += (current || 1) * 1_000_000
      current = 0
    } else if (WORD_NUM[tk] != null) {
      current += WORD_NUM[tk]
    }
  }
  return total + current
}

export function extractAmount(text: string): number {
  if (!text) return 0
  const lower = text.toLowerCase()

  // 1) Pola angka + satuan: "30rb", "1,5 jt", "250 ribu"
  const m = lower.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt|miliar|k|m)\b/)
  if (m) {
    const num = parseFloat(m[1].replace(',', '.'))
    return Math.round(num * (UNIT[m[2]] ?? 1))
  }

  // 2) Angka mentah dengan pemisah ribuan/desimal: "30.000", "30000", "1.500.000"
  const digitMatches = lower.match(/\d[\d.,]*/g)
  if (digitMatches) {
    const nums = digitMatches
      .map((d) => parseInt(d.replace(/[.,]/g, ''), 10))
      .filter((n) => !isNaN(n))
    if (nums.length) return Math.max(...nums) // ambil terbesar (mis. total struk)
  }

  // 3) Kata angka: "tiga puluh ribu"
  const w = parseWords(lower)
  return w
}

/** Tebak kategori dari kata kunci di teks (kembalikan nama kategori atau null). */
const CATEGORY_HINTS: Record<string, string[]> = {
  Makanan: ['makan', 'kopi', 'nasi', 'ayam', 'bakso', 'mie', 'sarapan', 'snack', 'jajan', 'minum'],
  Transport: ['bensin', 'grab', 'gojek', 'ojek', 'parkir', 'tol', 'angkot', 'busway', 'kereta'],
  Belanja: ['belanja', 'baju', 'sepatu', 'tokopedia', 'shopee', 'indomaret', 'alfamart'],
  Tagihan: ['listrik', 'pln', 'air', 'pdam', 'pulsa', 'paket', 'wifi', 'internet', 'bpjs'],
  Hiburan: ['nonton', 'film', 'game', 'netflix', 'spotify', 'konser'],
  Kesehatan: ['obat', 'dokter', 'apotek', 'rumah sakit', 'vitamin'],
}

export function guessCategoryName(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
    if (words.some((w) => lower.includes(w))) return cat
  }
  return null
}
