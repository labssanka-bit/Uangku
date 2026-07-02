import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_BUDGETS } from '@/lib/demo'
import type { Periode } from '@/lib/dateRange'
import type { Budget } from '@/types'

const KEY = 'budgets'

/**
 * Gabung anggaran: yang "semua bulan" (month=0,year=0) jadi default,
 * di-override oleh anggaran spesifik bulan ini bila ada (per kategori).
 */
function mergeBudgets(rows: Budget[], periode: Periode): Budget[] {
  const byCat = new Map<string, Budget>()
  for (const b of rows) if (b.month === 0) byCat.set(b.category_id, b) // default semua-bulan
  for (const b of rows) if (b.month === periode.month && b.year === periode.year) byCat.set(b.category_id, b) // spesifik menang
  return [...byCat.values()]
}

/** Anggaran untuk periode bulan tertentu, join kategori. */
export function useBudgets(periode: Periode) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [KEY, user?.id, periode.year, periode.month],
    enabled: !!user,
    queryFn: async (): Promise<Budget[]> => {
      if (isDemo()) {
        const rows = DEMO_BUDGETS.filter((b) => b.month === 0 || (b.month === periode.month && b.year === periode.year))
        return mergeBudgets(rows, periode)
      }
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .or(`and(month.eq.${periode.month},year.eq.${periode.year}),and(month.eq.0,year.eq.0)`)
      if (error) throw error
      return mergeBudgets(data as Budget[], periode)
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

  /** Hapus anggaran khusus 1 bulan (override) utk kategori → balik ke template tiap-bulan. */
  const removeOverride = useMutation({
    mutationFn: async ({ category_id, month, year }: { category_id: string; month: number; year: number }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user!.id)
        .eq('category_id', category_id)
        .eq('month', month)
        .eq('year', year)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { save, remove, removeOverride }
}
