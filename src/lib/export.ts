import { supabase } from './supabase'
import type { Transaction } from '@/types'

/** Ambil semua transaksi user lalu unduh sebagai file CSV. */
export async function exportTransactionsCSV() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name)')
    .order('date', { ascending: false })
  if (error) throw error

  const rows = data as (Transaction & { category: { name: string } | null })[]
  const header = ['Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Nominal']
  const lines = rows.map((t) =>
    [
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category?.name ?? '',
      (t.note ?? '').replace(/"/g, '""'),
      String(t.amount),
    ]
      .map((v) => `"${v}"`)
      .join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finplan-sanka-transaksi-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
