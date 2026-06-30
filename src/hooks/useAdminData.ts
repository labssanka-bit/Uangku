import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AdminCode {
  code: string
  uses: number
  max_uses: number
  note: string | null
  created_at: string
  last_used_at: string | null
}
export interface AdminUser {
  id: string
  email: string | null
  full_name: string
  is_admin: boolean
  code: string | null
  created_at: string
  last_sign_in_at: string | null
}
export interface AdminOverview {
  codes: { total: number; used: number; unusedCount: number; unused: AdminCode[] }
  users: AdminUser[]
}

async function callAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-data', { body })
  if (error) {
    let detail = error.message || 'Gagal memuat data admin.'
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        const b = await ctx.json()
        if (b?.error) detail = String(b.error)
      }
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  return data as T
}

export function useAdminOverview(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'overview'],
    enabled,
    queryFn: () => callAdmin<AdminOverview>({ action: 'overview' }),
  })
}

export function useGenerateCodes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (count: number) => callAdmin<{ generated: string[] }>({ action: 'gen', count }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => callAdmin<{ ok: boolean }>({ action: 'delete', userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  })
}
