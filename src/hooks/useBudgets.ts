import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_BUDGETS } from '@/lib/demo'
import type { Periode } from '@/lib/dateRange'
import type { Budget } from '@/types'

const KEY = 'budgets'

/** Anggaran untuk periode bulan tertentu, join kategori. */
export function useBudgets(periode: Periode) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, user?.id, periode.year, periode.month],
    enabled: !!user,
    queryFn: async (): Promise<Budget[]> => {
      if (isDemo()) return DEMO_BUDGETS.filter((b) => b.month === periode.month && b.year === periode.year)
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('month', periode.month)
        .eq('year', periode.year)
      if (error) throw error
      return data as Budget[]
    },
  })
}

export interface BudgetInput {
  category_id: string
  amount: number
  month: number
  year: number
}

export function useBudgetMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] })

  /** Upsert berdasarkan (user, category, month, year). */
  const save = useMutation({
    mutationFn: async (input: BudgetInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase
        .from('budgets')
        .upsert(
          { ...input, user_id: user!.id },
          { onConflict: 'user_id,category_id,month,year' }
        )
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { save, remove }
}
