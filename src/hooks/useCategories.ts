import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_CATEGORIES } from '@/lib/demo'
import type { Category, TxType } from '@/types'

const KEY = ['categories']

/** Ambil semua kategori milik user. */
export function useCategories(type?: TxType) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      if (isDemo()) return DEMO_CATEGORIES
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name')
      if (error) throw error
      return data as Category[]
    },
    select: (rows) => (type ? rows.filter((c) => c.type === type) : rows),
  })
}

export interface CategoryInput {
  name: string
  icon: string
  color: string
  type: TxType
}

/** Buat / ubah / hapus kategori custom. */
export function useCategoryMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

  const create = useMutation({
    mutationFn: async (input: CategoryInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: user!.id, is_default: false })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('categories').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
