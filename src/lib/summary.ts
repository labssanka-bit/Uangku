/** Hitungan ringkasan & insight dari daftar transaksi. */
import type { Transaction } from '@/types'
import { formatRupiahRingkas } from './format'
import { sisaHari, hariBerlalu } from './dateRange'

/**
 * Transfer antar dompet (note diawali "⇄") = pindah uang internal, BUKAN
 * pemasukan/pengeluaran nyata. Dikecualikan dari semua statistik income/expense
 * tapi TETAP dihitung di saldo tiap dompet (useWalletBalances).
 */
export const isTransfer = (t: Pick<Transaction, 'note'>): boolean =>
  (t.note ?? '').startsWith('⇄')

export const isAssetBuy = (t: Pick<Transaction, 'note'>): boolean =>
  (t.note ?? '').startsWith('Beli aset:')

/**
 * Klasifikasi satu transaksi jadi arus kas yang BERMAKNA:
 *  - income   : pemasukan nyata + penarikan tabungan (Saving→Cashflow)
 *  - expense  : pengeluaran konsumsi nyata (bukan transfer/beli aset)
 *  - nabung   : uang disisihkan = transfer Cashflow→Saving + beli aset
 *  - pakai    : bagian income yang berasal dari penarikan tabungan
 * Sisi "dalam" tabungan (leg di dompet Saving) diabaikan agar tak dobel.
 */
export function txFlow(t: Transaction): { income: number; expense: number; nabung: number; pakai: number } {
  if (isTransfer(t)) {
    const n = t.note ?? ''
    // Cashflow → Saving: uang keluar dari cashflow = menabung (leg cashflow)
    if (n.startsWith('⇄ Menabung')) return { income: 0, expense: 0, nabung: t.amount, pakai: 0 }
    // Saving → Cashflow: uang masuk ke cashflow = pakai tabungan (leg cashflow)
    if (n.startsWith('⇄ Ambil tabungan')) return { income: t.amount, expense: 0, nabung: 0, pakai: t.amount }
    // Sisanya (pindah antar-cashflow, leg sisi Saving) = pindah murni, netral
    return { income: 0, expense: 0, nabung: 0, pakai: 0 }
  }
  if (t.type === 'income') return { income: t.amount, expense: 0, nabung: 0, pakai: 0 }
  if (isAssetBuy(t)) return { income: 0, expense: 0, nabung: t.amount, pakai: 0 } // beli aset = investasi
  return { income: 0, expense: t.amount, nabung: 0, pakai: 0 }
}

export interface MonthSummary {
  income: number // pemasukan nyata + pakai tabungan
  expense: number // pengeluaran konsumsi
  nabung: number // disisihkan ke Saving + beli aset
  net: number // income - expense - nabung (sisa arus kas cashflow)
  count: number
  /** total pengeluaran per kategori, urut terbesar */
  byCategory: { id: string; name: string; color: string; icon: string; total: number; pct: number }[]
  largest: Transaction | null
  avgPerDay: number // rata-rata pengeluaran per hari berlalu
  savingsRatio: number // nabung / pemasukan-nyata, 0..1
}

export function summarize(transactions: Transaction[], ref: Date): MonthSummary {
  let income = 0
  let expense = 0
  let nabung = 0
  let pakai = 0
  let largest: Transaction | null = null
  const catMap = new Map<string, { name: string; color: string; icon: string; total: number }>()

  for (const t of transactions) {
    const f = txFlow(t)
    income += f.income
    expense += f.expense
    nabung += f.nabung
    pakai += f.pakai
    if (f.expense > 0) {
      if (!largest || t.amount > largest.amount) largest = t
      const key = t.category_id ?? 'lain'
      const prev = catMap.get(key)
      catMap.set(key, {
        name: t.category?.name ?? 'Lainnya',
        color: t.category?.color ?? '#64748b',
        icon: t.category?.icon ?? 'tag',
        total: (prev?.total ?? 0) + f.expense,
      })
    }
  }

  const byCategory = Array.from(catMap.entries())
    .map(([id, v]) => ({ id, ...v, pct: expense > 0 ? v.total / expense : 0 }))
    .sort((a, b) => b.total - a.total)

  const days = hariBerlalu(ref)
  const realIncome = income - pakai // pemasukan asli (tanpa penarikan tabungan)
  const savingsRatio = realIncome > 0 ? Math.min(1, Math.max(0, nabung / realIncome)) : 0

  return {
    income,
    expense,
    nabung,
    net: income - expense - nabung,
    count: transactions.length,
    byCategory,
    largest,
    avgPerDay: days > 0 ? expense / days : 0,
    savingsRatio,
  }
}

/**
 * Insight cerdas untuk kartu ungu di dashboard.
 * Menghitung "uang aman harian" = sisa saldo bulan / sisa hari, dan kategori dominan.
 */
export function buildInsight(s: MonthSummary, balance: number, ref: Date): string {
  const parts: string[] = []

  const days = sisaHari(ref)
  if (balance > 0 && days > 0) {
    const perHari = balance / days
    parts.push(`Uang aman harianmu s.d akhir bulan: ${formatRupiahRingkas(perHari)}/hari.`)
  } else if (balance <= 0) {
    parts.push('Saldomu menipis — hati-hati pengeluaran sampai akhir bulan.')
  }

  const top = s.byCategory[0]
  if (top && top.pct > 0) {
    parts.push(
      `Pengeluaran terbesarmu (${Math.round(top.pct * 100)}%) ada di kategori ${top.name}.`
    )
  }

  if (s.expense > s.income && s.income > 0) {
    parts.push('⚠️ Pengeluaran bulan ini melebihi pemasukan.')
  }

  return parts.join(' ') || 'Mulai catat transaksi untuk melihat insight keuanganmu.'
}

/**
 * Banding pengeluaran bulan ini vs bulan lalu.
 * Kembalikan null bila bulan lalu kosong (tak ada pembanding).
 */
export function buildComparison(curExpense: number, prevExpense: number): string | null {
  if (prevExpense <= 0) return null
  const diff = curExpense - prevExpense
  const pct = Math.round((Math.abs(diff) / prevExpense) * 100)
  if (pct < 1) return 'Pengeluaranmu stabil dibanding bulan lalu.'
  if (diff > 0) return `Pengeluaran naik ${pct}% dari bulan lalu (${formatRupiahRingkas(diff)}).`
  return `Mantap! Pengeluaran turun ${pct}% dari bulan lalu (${formatRupiahRingkas(-diff)}). 🎉`
}
