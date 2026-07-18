import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo, demoBlock, DEMO_PROFILE } from '@/lib/demo'
import type { Profile } from '@/types'

const KEY = ['profile']

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...KEY, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (isDemo()) return DEMO_PROFILE
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'full_name' | 'currency' | 'opening_balance' | 'spending_reasons'>>) => {
      if (isDemo()) return demoBlock()
      // Upsert agar baris profil dibuat bila belum ada (mis. trigger tak jalan)
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user!.id, ...patch }, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['transactions'] }) // saldo ikut berubah
    },
  })
}
