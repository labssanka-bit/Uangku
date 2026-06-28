import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_ASSETS } from '@/lib/demo'
import type { Asset, AssetType } from '@/types'

const KEY = ['assets']

export function useAssets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Asset[]> => {
      if (isDemo()) return DEMO_ASSETS
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Asset[]
    },
  })
}

export interface AssetInput {
  name: string
  type: AssetType
  quantity: number
  buy_price: number
  current_value: number
  date: string
  note: string | null
}

export function useAssetMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

  const create = useMutation({
    mutationFn: async (input: AssetInput) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('assets').insert({ ...input, user_id: user!.id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<AssetInput> & { id: string }) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('assets').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) return demoBlock()
      const { error } = await supabase.from('assets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
