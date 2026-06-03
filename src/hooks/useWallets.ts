import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Wallet, WalletGroup } from '@/types'

const KEY = ['wallets']

export function useWallets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Wallet[]> => {
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
    qc.invalidateQueries({ queryKey: ['transactions'] }) // saldo ikut berubah
  }

  const create = useMutation({
    mutationFn: async (input: WalletInput) => {
      const { error } = await supabase.from('wallets').insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<WalletInput> & { id: string }) => {
      const { error } = await supabase.from('wallets').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wallets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export interface WalletBalance extends Wallet {
  balance: number // opening_balance + (income - expense) pada dompet ini
}

/**
 * Saldo tiap dompet = opening_balance + arus transaksi pada dompet tsb.
 * Mengambil seluruh transaksi (ringan: amount,type,wallet_id) sekali.
 */
export function useWalletBalances() {
  const { user } = useAuth()
  const wallets = useWallets()

  const tx = useQuery({
    queryKey: ['transactions', 'wallet-flow', user?.id],
    enabled: !!user,
    queryFn: async () => {
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

  // Total transaksi tanpa dompet (legacy) — tetap dihitung di total saldo
  const unassigned = (tx.data ?? [])
    .filter((t) => !t.wallet_id)
    .reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0)

  const byGroup = (g: WalletGroup) =>
    balances.filter((w) => w.group === g).reduce((a, w) => a + w.balance, 0)

  return {
    isLoading: wallets.isLoading || tx.isLoading,
    wallets: balances,
    unassigned,
    cashflowTotal: byGroup('cashflow'),
    savingTotal: byGroup('saving'),
    total: balances.reduce((a, w) => a + w.balance, 0) + unassigned,
  }
}
