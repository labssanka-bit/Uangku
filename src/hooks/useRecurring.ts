import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { RecurringTransaction, RecurrenceFreq, TxType } from '@/types'

const KEY = 'recurring'

export function useRecurring() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, category:categories(*)')
        .order('next_date')
      if (error) throw error
      return data as RecurringTransaction[]
    },
  })
}

export interface RecurringInput {
  category_id: string | null
  amount: number
  type: TxType
  note: string | null
  frequency: RecurrenceFreq
  next_date: string
  is_active?: boolean
}

export function useRecurringMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] })

  const create = useMutation({
    mutationFn: async (input: RecurringInput) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RecurringInput> & { id: string }) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .update(input)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
