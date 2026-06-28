import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_DEBTS } from '@/lib/demo'
import type { Debt, DebtType } from '@/types'

const KEY = ['debts']

export function useDebts() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Debt[]> => {
      if (isDemo()) return DEMO_DEBTS
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('status')
        .order('due_date', { nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Debt[]
    },
  })
}

export interface DebtInput {
  person: string
  amount: number
  type: DebtType
  due_date: string | null
  note: string | null
  wallet_id: string | null
}

export function useDebtMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY })
    qc.invalidateQueries({ queryKey: ['transactions'] })
  }

  const create = useMutation({
    mutationFn: async (input: DebtInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('debts').insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Debt> & { id: string }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('debts').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('debts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  /**
   * Bayar/cicil hutang-piutang. Menambah paid_amount, set lunas bila penuh,
   * dan (opsional) buat transaksi di dompet terkait.
   */
  const pay = useMutation({
    mutationFn: async ({
      debt,
      payAmount,
      recordTx,
    }: {
      debt: Debt
      payAmount: number
      recordTx: boolean
    }) => {
      if (isDemo()) return demoBlock()
      const newPaid = Math.min(debt.paid_amount + payAmount, debt.amount)
      const status = newPaid >= debt.amount ? 'lunas' : 'belum'
      const { error } = await supabase
        .from('debts')
        .update({ paid_amount: newPaid, status })
        .eq('id', debt.id)
      if (error) throw error

      if (recordTx && payAmount > 0) {
        // Bayar hutang = uang keluar; terima piutang = uang masuk
        const type = debt.type === 'hutang' ? 'expense' : 'income'
        const { error: txErr } = await supabase.from('transactions').insert({
          user_id: user!.id,
          category_id: null,
          amount: payAmount,
          type,
          note: `${debt.type === 'hutang' ? 'Bayar hutang' : 'Terima piutang'} — ${debt.person}`,
          date: new Date().toISOString().slice(0, 10),
          wallet_id: debt.wallet_id,
        })
        if (txErr) throw txErr
      }
    },
    onSuccess: invalidate,
  })

  return { create, update, remove, pay }
}
