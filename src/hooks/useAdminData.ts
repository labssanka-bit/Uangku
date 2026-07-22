import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AdminCode {
  code: string
  uses: number
  max_uses: number
  note: string | null
  created_at: string
  last_used_at: string | null
  reserved_email?: string | null
  reserved_at?: string | null
  /** Masa aktif: null = lifetime, angka = jumlah bulan */
  duration_months?: number | null
}
export interface AdminUser {
  id: string
  email: string | null
  full_name: string
  is_admin: boolean
  code: string | null
  created_at: string
  last_sign_in_at: string | null
  last_seen?: string | null
  access_until?: string | null
  tx_count?: number
  est_bytes?: number
}
export interface AdminUsage {
  db_bytes: number
  limit_bytes: number
  tx_total: number
  tables: { name: string; bytes: number }[]
}
export interface AdminOverview {
  codes: {
    total: number
    used: number
    unusedCount: number
    unused: AdminCode[]
    reservedCount?: number
    reserved?: AdminCode[]
  }
  users: AdminUser[]
  usage?: AdminUsage
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
    mutationFn: ({ count, months }: { count: number; months: number | null }) =>
      callAdmin<{ generated: string[] }>({ action: 'gen', count, months }),
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

/** Tandai kode "sudah dikasih ke calon pembeli" (label = nama/no WA). */
export function useReserveCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, label, months }: { code: string; label: string; months: number | null }) =>
      callAdmin<{ ok: boolean }>({ action: 'reserve', code, label, months }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  })
}

/** Batalkan tanda "sudah dikasih" → kode kembali tersedia. */
export function useUnreserveCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => callAdmin<{ ok: boolean }>({ action: 'unreserve', code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  })
}

/** Kirim email kode + cara aktivasi ke pembeli. Menandai kode "sudah dikasih". */
export function useSendCodeEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, email, name, months }: { code: string; email: string; name: string; months: number | null }) =>
      callAdmin<{ ok: boolean }>({ action: 'send_email', code, email, name, months }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
  })
}
