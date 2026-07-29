import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isDemo } from '@/lib/demo'
import type { Announcement } from '@/types'

/** Pengumuman/update aktif untuk user (terbaru dulu). */
export function useAnnouncements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['announcements', user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Announcement[]> => {
      if (isDemo()) return []
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as Announcement[]
    },
  })
}
