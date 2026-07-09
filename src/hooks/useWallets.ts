import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_WALLETS, DEMO_TRANSACTIONS } from '@/lib/demo'
import type { Wallet, WalletGroup } from '@/types'

const KEY = ['wallets']

export function useWallets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Wallet[]> => {
      if (isDemo()) return DEMO_WALLETS
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return data as Wallet[]
    },
  })
}

export interface WalletInput {
  group: WalletGroup
  name: string
  icon: string
  color: string
  opening_balance: number
}

export function useWalletMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['transactions'] })
  }

  const create = useMutation({
    mutationFn: async (input: WalletInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('wallets').insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<WalletInput> & { id: string }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('wallets').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('wallets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  /**
   * Pindah uang antar dompet: 2 transaksi (expense dari sumber, income ke tujuan).
   * Note diawali "⇄" (terdeteksi transfer). Marker menentukan efek ke Cashflow:
   *  - Cashflow→Saving  : "⇄ Menabung …"       (keluar dari cashflow = nabung)
   *  - Saving→Cashflow  : "⇄ Ambil tabungan …" (masuk ke cashflow = pakai tabungan)
   *  - grup sama         : "⇄ Transfer …"       (pindah murni, netral)
   */
  const transfer = useMutation({
    mutationFn: async ({
      fromId, fromName, fromGroup, toId, toName, toGroup, amount, note, date,
    }: {
      fromId: string; fromName: string; fromGroup: WalletGroup
      toId: string; toName: string; toGroup: WalletGroup
      amount: number; note: string; date: string
    }) => {
      if (isDemo()) return demoBlock()
      const tail = note ? ` (${note})` : ''
      let fromNote: string
      let toNote: string
      if (fromGroup === 'cashflow' && toGroup === 'saving') {
        fromNote = `⇄ Menabung ke ${toName}${tail}`
        toNote = `⇄ Setoran dari ${fromName}${tail}`
      } else if (fromGroup === 'saving' && toGroup === 'cashflow') {
        fromNote = `⇄ Penarikan ke ${toName}${tail}`
        toNote = `⇄ Ambil tabungan dari ${fromName}${tail}`
      } else {
        fromNote = `⇄ Transfer ke ${toName}${tail}`
        toNote = `⇄ Transfer dari ${fromName}${tail}`
      }
      const { error } = await supabase.from('transactions').insert([
        { user_id: user!.id, amount, type: 'expense', wallet_id: fromId, note: fromNote, date, category_id: null, is_recurring: false },
        { user_id: user!.id, amount, type: 'income', wallet_id: toId, note: toNote, date, category_id: null, is_recurring: false },
      ])
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, transfer }
}

export interface WalletBalance extends Wallet {
  balance: number
}

export function useWalletBalances() {
  const { user } = useAuth()
  const wallets = useWallets()

  const tx = useQuery({
    queryKey: ['transactions', 'wallet-flow', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (isDemo()) return DEMO_TRANSACTIONS.map((t) => ({ amount: t.amount, type: t.type, wallet_id: t.wallet_id }))
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, wallet_id')
      if (error) throw error
      return data as { amount: number; type: string; wallet_id: string | null }[]
    },
  })

  const flow = new Map<string, number>()
  for (const t of tx.data ?? []) {
    if (!t.wallet_id) continue
    flow.set(t.wallet_id, (flow.get(t.wallet_id) ?? 0) + (t.type === 'income' ? t.amount : -t.amount))
  }

  const balances: WalletBalance[] = (wallets.data ?? []).map((w) => ({
    ...w,
    balance: w.opening_balance + (flow.get(w.id) ?? 0),
  }))

  const unassigned = (tx.data ?? [])
    .filter((t) => !t.wallet_id)
    .reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0)

  const byGroup = (g: WalletGroup) =>
    balances.filter((w) => w.group === g).reduce((a, w) => a + w.balance, 0)

  return {
    isLoading: wallets.isLoading || tx.isLoading,
    wallets: balances,
    unassigned,
    // Transaksi tanpa dompet (legacy) dianggap bagian Cashflow (uang utama).
    // → Total Saldo = Cashflow card = byGroup('cashflow') + unassigned.
    cashflowTotal: byGroup('cashflow') + unassigned,
    savingTotal: byGroup('saving'),
    // Total kekayaan dompet = semua (cashflow + saving), utk Net Worth di Aset.
    total: balances.reduce((a, w) => a + w.balance, 0) + unassigned,
  }
}


