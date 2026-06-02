/** Hitungan ringkasan & insight dari daftar transaksi. */
import type { Transaction } from '@/types'
import { formatRupiahRingkas } from './format'
import { sisaHari, hariBerlalu } from './dateRange'

export interface MonthSummary {
  income: number
  expense: number
  net: number // income - expense
  count: number
  /** total pengeluaran per kategori, urut terbesar */
  byCategory: { id: string; name: string; color: string; icon: string; total: number; pct: number }[]
  largest: Transaction | null
  avgPerDay: number // rata-rata pengeluaran per hari berlalu
  savingsRatio: number // (income - expense) / income, 0..1
}

export function summarize(transactions: Transaction[], ref: Date): MonthSummary {
  let income = 0
  let expense = 0
  let largest: Transaction | null = null
  const catMap = new Map<string, { name: string; color: string; icon: string; total: number }>()

  for (const t of transactions) {
    if (t.type === 'income') income += t.amount
    else {
      expense += t.amount
      if (!largest || t.amount > largest.amount) largest = t
      const key = t.category_id ?? 'lain'
      const prev = catMap.get(key)
      catMap.set(key, {
        name: t.category?.name ?? 'Lainnya',
        color: t.category?.color ?? '#64748b',
        icon: t.category?.icon ?? 'tag',
        total: (prev?.total ?? 0) + t.amount,
      })
    }
  }

  const byCategory = Array.from(catMap.entries())
    .map(([id, v]) => ({ id, ...v, pct: expense > 0 ? v.total / expense : 0 }))
    .sort((a, b) => b.total - a.total)

  const days = hariBerlalu(ref)
  const savingsRatio = income > 0 ? Math.max(0, (income - expense) / income) : 0

  return {
    income,
    expense,
    net: income - expense,
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
