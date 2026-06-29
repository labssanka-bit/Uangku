import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { SupportMessage, Profile } from '@/types'

const KEY = ['support']

/** Pesan dalam 1 percakapan (user_id tertentu). Polling saat dibuka. */
export function useChatMessages(userId: string | null, active: boolean) {
  return useQuery({
    queryKey: [...KEY, 'msgs', userId],
    enabled: !!userId,
    refetchInterval: active ? 4000 : false,
    queryFn: async (): Promise<SupportMessage[]> => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as SupportMessage[]
    },
  })
}

/** Daftar percakapan utk admin (group per user + pesan terakhir). */
export interface Conversation {
  user_id: string
  name: string
  last: string
  last_at: string
  unread: number
}
export function useAdminConversations(enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, 'convos'],
    enabled,
    refetchInterval: enabled ? 5000 : false,
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (error) throw error
      const msgs = data as SupportMessage[]
      const ids = [...new Set(msgs.map((m) => m.user_id))]
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids)
      const nameOf = new Map((profs as Pick<Profile, 'id' | 'full_name'>[] ?? []).map((p) => [p.id, p.full_name]))
      const map = new Map<string, Conversation>()
      for (const m of msgs) {
        if (!map.has(m.user_id)) {
          map.set(m.user_id, {
            user_id: m.user_id,
            name: nameOf.get(m.user_id) || 'Pengguna',
            last: m.body,
            last_at: m.created_at,
            unread: 0,
          })
        }
        const c = map.get(m.user_id)!
        if (m.sender === 'user' && !m.read_admin) c.unread++
      }
      return [...map.values()]
    },
  })
}

/** Total pesan admin belum dibaca user (badge tombol bantuan). */
export function useUserUnread(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, 'unread', userId],
    enabled: enabled && !!userId,
    refetchInterval: enabled ? 8000 : false,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('sender', 'admin')
        .eq('read_user', false)
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useChatMutations() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const send = useMutation({
    mutationFn: async ({ userId, sender, body }: { userId: string; sender: 'user' | 'admin'; body: string }) => {
      const { error } = await supabase.from('support_messages').insert({ user_id: userId, sender, body })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  /** Tandai pesan lawan-bicara sebagai dibaca. */
  const markRead = useMutation({
    mutationFn: async ({ userId, as }: { userId: string; as: 'user' | 'admin' }) => {
      const col = as === 'admin' ? 'read_admin' : 'read_user'
      const otherSender = as === 'admin' ? 'user' : 'admin'
      await supabase.from('support_messages').update({ [col]: true })
        .eq('user_id', userId).eq('sender', otherSender).eq(col, false)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return { send, markRead, me: user?.id ?? null }
}
