import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Periode } from '@/lib/dateRange'
import type { Transaction, TransactionInput } from '@/types'

const KEY = 'transactions'

/** Ambil transaksi pada satu periode bulan, terbaru dulu, join kategori. */
export function useTransactions(periode: Periode) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, user?.id, periode.year, periode.month],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*), wallet:wallets(*)')
        .gte('date', periode.start)
        .lte('date', periode.end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Transaction[]
    },
  })
}

/** Ambil N transaksi terbaru (lintas bulan) untuk dashboard. */
export function useRecentTransactions(limit = 5) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, 'recent', user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*), wallet:wallets(*)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useTransactionMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] })

  const create = useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: string }) => {
      const { error } = await supabase.from('transactions').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

/** Transaksi pada rentang tanggal bebas (untuk grafik tren multi-bulan). */
export function useTransactionsBetween(startISO: string, endISO: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, 'range', user?.id, startISO, endISO],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*), wallet:wallets(*)')
        .gte('date', startISO)
        .lte('date', endISO)
        .order('date', { ascending: true })
      if (error) throw error
      return data as Transaction[]
    },
  })
}

/** Semua tanggal transaksi (untuk hitung streak). */
export function useTransactionDates() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, 'dates', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('transactions').select('date')
      if (error) throw error
      return (data as { date: string }[]).map((r) => r.date)
    },
  })
}

/** Total saldo seluruh waktu (pemasukan - pengeluaran). */
export function useTotalBalance() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, 'balance', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.from('transactions').select('amount, type')
      if (error) throw error
      return (data as { amount: number; type: string }[]).reduce(
        (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
        0
      )
    },
  })
}
